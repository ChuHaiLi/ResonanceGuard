"""Read-only, redacted analysis of Wokwi's unencrypted 802.11 classic PCAP.

Capture timestamps use the simulation clock. This is an evidence utility,
not firmware, a simulator peer, or a program integration test.
"""
import collections
import hashlib
import json
import re
import struct
import sys
from pathlib import Path


def analyze(filename):
    raw = Path(filename).read_bytes()
    magic = raw[:4]
    variants = {
        b'\xd4\xc3\xb2\xa1': ('<', 1e6),
        b'\x4d\x3c\xb2\xa1': ('<', 1e9),
        b'\xa1\xb2\xc3\xd4': ('>', 1e6),
        b'\xa1\xb2\x3c\x4d': ('>', 1e9),
    }
    endian, resolution = variants[magic]
    _, _, _, _, _, _, linktype = struct.unpack_from(endian + 'IHHIIII', raw)
    if linktype != 105:
        raise ValueError('Expected IEEE 802.11 linktype 105')
    packets = 0
    connections = {}
    protocols = collections.Counter()
    offset = 24
    while offset + 16 <= len(raw):
        seconds, fraction, length, original_length = struct.unpack_from(endian + 'IIII', raw, offset)
        offset += 16
        frame = raw[offset:offset + length]
        offset += length
        packets += 1
        timestamp = seconds + fraction / resolution
        if len(frame) < 24:
            continue
        control = int.from_bytes(frame[:2], 'little')
        frame_type = (control >> 2) & 3
        subtype = (control >> 4) & 15
        if frame_type != 2:
            continue
        header = 24 + (6 if control & 0x300 == 0x300 else 0) + (2 if subtype & 8 else 0)
        payload = frame[header:]
        if payload[:6] != b'\xaa\xaa\x03\x00\x00\x00':
            continue
        ethertype = int.from_bytes(payload[6:8], 'big')
        if ethertype != 0x800:
            continue
        ip = payload[8:]
        if len(ip) < 20:
            continue
        ip_header = (ip[0] & 15) * 4
        ip_length = int.from_bytes(ip[2:4], 'big')
        protocol = ip[9]
        protocols[protocol] += 1
        if protocol != 6 or int.from_bytes(ip[6:8], 'big') & 0x1fff:
            continue
        tcp = ip[ip_header:ip_length]
        if len(tcp) < 20:
            continue
        source, destination, seq, ack = struct.unpack_from('!HHII', tcp)
        if 1883 not in (source, destination):
            continue
        direction = 'esp_to_broker' if destination == 1883 else 'broker_to_esp'
        key = (ip[12:16], source, ip[16:20], destination) if destination == 1883 else (ip[16:20], destination, ip[12:16], source)
        if key not in connections:
            connections[key] = {'connection': len(connections) + 1, 'segments': [], 'tcp_events': []}
        connection = connections[key]
        tcp_header = (tcp[12] >> 4) * 4
        flags = tcp[13]
        body = tcp[tcp_header:]
        segment = {'packet': packets, 't_sim_s': timestamp, 'direction': direction,
                   'seq': seq, 'ack': ack, 'flags': flags, 'body': body}
        connection['segments'].append(segment)
        if flags & 7:
            connection['tcp_events'].append({
                'packet': packets, 't_sim_s': timestamp, 'direction': direction,
                'flags': '|'.join(name for bit, name in [(2, 'SYN'), (1, 'FIN'), (4, 'RST'), (16, 'ACK')] if flags & bit),
                'payload_bytes': len(body)})

    names = {1: 'CONNECT', 2: 'CONNACK', 3: 'PUBLISH', 4: 'PUBACK', 5: 'PUBREC',
             6: 'PUBREL', 7: 'PUBCOMP', 8: 'SUBSCRIBE', 9: 'SUBACK',
             10: 'UNSUBSCRIBE', 11: 'UNSUBACK', 12: 'PINGREQ', 13: 'PINGRESP', 14: 'DISCONNECT'}
    results = []
    for connection in connections.values():
        messages = []
        issues = []
        for direction in ['esp_to_broker', 'broker_to_esp']:
            segments = sorted((s for s in connection['segments'] if s['direction'] == direction and s['body']), key=lambda s: (s['seq'], s['t_sim_s']))
            data = bytearray()
            provenance = []
            next_seq = None
            for segment in segments:
                seq = segment['seq']
                if next_seq is None:
                    next_seq = seq
                if seq > next_seq:
                    issues.append({'kind': 'tcp_stream_gap', 'direction': direction,
                                   'missing_bytes': seq - next_seq, 'packet': segment['packet']})
                    break
                skip = max(0, next_seq - seq)
                added = segment['body'][skip:]
                if added:
                    start = len(data)
                    data.extend(added)
                    provenance.append((start, len(data), segment))
                    next_seq += len(added)
            cursor = 0
            while cursor < len(data):
                start = cursor
                first = data[cursor]
                cursor += 1
                remaining = 0
                multiplier = 1
                for _ in range(4):
                    if cursor >= len(data):
                        break
                    digit = data[cursor]
                    cursor += 1
                    remaining += (digit & 127) * multiplier
                    multiplier *= 128
                    if digit < 128:
                        break
                end = cursor + remaining
                if end > len(data):
                    issues.append({'kind': 'incomplete_mqtt_packet', 'direction': direction,
                                   'remaining_length': remaining, 'available_bytes': len(data) - cursor})
                    break
                body = bytes(data[cursor:end])
                cursor = end
                contributing = [p for a, b, p in provenance if b > start and a < end]
                packet_type = first >> 4
                row = {'type': names.get(packet_type, 'UNKNOWN'), 'direction': direction,
                       't_first_sim_s': contributing[0]['t_sim_s'],
                       't_complete_sim_s': max(p['t_sim_s'] for p in contributing),
                       'first_packet': contributing[0]['packet'], 'bytes': end - start,
                       'tcp_segments': len(contributing)}
                if packet_type == 1 and len(body) >= 10:
                    protocol_length = int.from_bytes(body[:2], 'big')
                    flags_at = 2 + protocol_length + 1
                    flags = body[flags_at]
                    row['keepalive_s'] = int.from_bytes(body[flags_at + 1:flags_at + 3], 'big')
                    row['username_present'] = bool(flags & 128)
                    row['password_present'] = bool(flags & 64)
                    row['clean_session'] = bool(flags & 2)
                    pos = flags_at + 3
                    n = int.from_bytes(body[pos:pos + 2], 'big')
                    identity = body[pos + 2:pos + 2 + n].decode('utf8', errors='replace')
                    boot = re.search(r'-([a-f0-9]{16})$', identity)
                    row['boot_id'] = boot.group(1) if boot else None
                elif packet_type == 2:
                    row['return_code'] = body[1] if len(body) >= 2 else None
                elif packet_type in (4, 9):
                    row['packet_id'] = int.from_bytes(body[:2], 'big')
                    if packet_type == 9:
                        row['granted_qos'] = list(body[2:])
                elif packet_type == 3:
                    row['qos'] = (first >> 1) & 3
                    row['retain'] = bool(first & 1)
                    topic_length = int.from_bytes(body[:2], 'big')
                    topic = body[2:2 + topic_length].decode('utf8', errors='replace')
                    row['topic_sha256'] = hashlib.sha256(body[2:2 + topic_length]).hexdigest()
                    row['topic_length'] = topic_length
                    row['topic_suffix'] = next((s for s in ['telemetry/vibration', 'telemetry/rpm', 'cmd/motor', 'state', 'ack'] if topic.endswith('/' + s)), 'other_redacted')
                    pos = 2 + topic_length
                    if row['qos']:
                        row['packet_id'] = int.from_bytes(body[pos:pos + 2], 'big')
                        pos += 2
                    try:
                        document = json.loads(body[pos:])
                        allowed = ['boot_id', 'seq', 't_device_ms', 'source', 'quality', 'command_id', 'action', 'accepted', 'reason', 'running', 'duty', 'stop_reason']
                        row['metadata'] = {k: document[k] for k in allowed if k in document}
                    except (ValueError, TypeError):
                        row['json_valid'] = False
                messages.append(row)
        messages.sort(key=lambda x: x['t_complete_sim_s'])
        results.append({'connection': connection['connection'],
                        'tcp_segment_count': len(connection['segments']),
                        'tcp_events': connection['tcp_events'], 'parse_issues': issues,
                        'mqtt_counts': dict(collections.Counter(m['type'] for m in messages)),
                        'messages': messages})
    return {'capture_sha256': hashlib.sha256(raw).hexdigest(), 'capture_bytes': len(raw),
            'packet_count': packets, 'linktype': linktype, 'timestamp_clock': 'Wokwi simulation clock; not server wall clock',
            'redaction': 'No IP/MAC addresses, DNS names, namespace, credentials or full payload exported.',
            'ipv4_protocol_counts': dict(protocols), 'connections': results}


if __name__ == '__main__':
    report = analyze(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({
        'packet_count': report['packet_count'], 'connections': [
            {k: c[k] for k in ['connection', 'tcp_segment_count', 'tcp_events', 'parse_issues', 'mqtt_counts']}
            for c in report['connections']
        ]}, indent=2))
