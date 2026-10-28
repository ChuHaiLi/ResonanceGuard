import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { latestReading } from './freshness.js';
import { ControlSession, ConnectionHealth } from './control.js';

function traceControl(stage, details)
{
    console.info('RG_TRACE', { at: Date.now(), source: 'synthetic', stage, ...details });
}

function Chart({ rows, type, fields, colors, label })
{
    const samples = rows.filter(row => row.type === type).slice(-100);
    const numbers = samples.flatMap(row => fields.map(key => row.data[key])).filter(Number.isFinite);
    const lo = Math.min(0, ...numbers);
    const hi = Math.max(1, ...numbers);
    const paths = fields.map(key =>
    {
        let started = false;
        return samples.map((row, index) =>
        {
            const value = row.data[key];
            if (!Number.isFinite(value))
            {
                started = false;
                return '';
            }
            const operation = started ? 'L' : 'M';
            started = true;
            return `${operation}${index * 600 / 99},${160 - (value - lo) / (hi - lo) * 140}`;
        }).join(' ');
    });
    return <section><h2>{label}</h2><p>{fields.join(' / ')} · từ {lo.toFixed(1)} đến {hi.toFixed(1)} · tối đa 100 điểm nhận gần nhất</p>
        <svg viewBox="0 0 600 180" role="img" aria-label={label}>
            <path d="M0 160 H600" stroke="#42506a" />
            {paths.map((path, i) => <path key={fields[i]} d={path} fill="none" stroke={colors[i]} strokeWidth="2" />)}
        </svg><small>Trục ngang: thứ tự bản tin, khoảng cách nhận có thể không đều. Chưa dùng để phân tích FFT.</small></section>;
}

function App()
{
    const [model, setModel] = useState({ history: [], stale: true });
    const [duty, setDuty] = useState(30);
    const [message, setMessage] = useState('Chờ kết nối backend…');
    const [lastCommandId, setLastCommandId] = useState(null);
    const [wsReady, setWsReady] = useState(false);
    const [clock, setClock] = useState(Date.now());
    const [lastStateAt, setLastStateAt] = useState(0);
    const sessionRef = useRef(new ControlSession());
    const dutyRef = useRef(30);
    const acksRef = useRef(new Map());
    const bootRef = useRef(null);
    const healthRef = useRef(new ConnectionHealth());
    const stale = !lastStateAt || clock - lastStateAt > 4000 || !wsReady || !model.broker_connected || model.broker_subscribed === false;
    const rpmReading = latestReading(model.history, 'telemetry/rpm', model.state?.boot_id, clock, !stale);
    const imuReading = latestReading(model.history, 'telemetry/vibration', model.state?.boot_id, clock, !stale);
    const rpm = rpmReading.stale ? null : rpmReading.data;
    const imu = imuReading.stale ? null : imuReading.data;

    function disarm(reason = 'manual_start_or_stop')
    {
        if (sessionRef.current.active || sessionRef.current.pending.size)
        {
            traceControl('FRONT_DISARM', { reason, pending: [...sessionRef.current.pending.keys()] });
        }
        sessionRef.current.disarm();
    }

    function applyAck(ack)
    {
        const healthy = healthRef.current.healthy();
        const record = sessionRef.current.acknowledge(ack, healthy);
        traceControl('FRONT_ACK_DECISION', { command_id: ack.command_id, decision: sessionRef.current.lastAckDecision,
            healthy, renew_active: sessionRef.current.active });
        if (!record)
        {
            return;
        }
        if (!record.silent || !ack.accepted)
        {
            setMessage(`ESP ${ack.accepted ? 'chấp nhận' : 'từ chối'}: ${ack.reason} · ${ack.command_id.slice(0, 8)}${healthy ? '' : ' · Kết nối/state không mới: không renew'}`);
        }
    }

    async function command(action, silent = false)
    {
        if (action === 'stop' || action === 'start')
        {
            disarm();
        }
        const epoch = sessionRef.current.epoch;
        const requestedAt = Date.now();
        traceControl('FRONT_HTTP_REQUEST', { action, epoch });
        try
        {
            const response = await fetch('/api/motor', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000),
                body: JSON.stringify({ action, duty: dutyRef.current / 100 })
            });
            const data = await response.json();
            if (!response.ok)
            {
                throw new Error(data.error);
            }
            if (!sessionRef.current.register(data.command_id, action, silent, epoch, requestedAt))
            {
                traceControl('FRONT_HTTP_DROP_OLD_EPOCH', { command_id: data.command_id, action, epoch });
                return;
            }
            traceControl('FRONT_HTTP_REGISTER', { command_id: data.command_id, action, epoch });
            if (!silent)
            {
                setLastCommandId(data.command_id);
                setMessage(`Đã gửi ${action}; chờ ESP ACK · ${data.command_id.slice(0, 8)}`);
            }
            const earlyAck = acksRef.current.get(data.command_id);
            if (earlyAck)
            {
                applyAck(earlyAck);
            }
        }
        catch (error)
        {
            if (epoch === sessionRef.current.epoch)
            {
                traceControl('FRONT_HTTP_ERROR', { action, error: error.message });
                disarm('http_error_or_timeout');
                setMessage(error.message);
            }
        }
    }

    useEffect(() =>
    {
        let socket;
        let retry;
        let disposed = false;
        function connect()
        {
            socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
            socket.onopen = () =>
            {
                healthRef.current.ws = true;
                setWsReady(true);
                traceControl('FRONT_WS_OPEN', {});
            };
            socket.onclose = () =>
            {
                setWsReady(false);
                healthRef.current.ws = false;
                traceControl('FRONT_WS_CLOSED', {});
                disarm('websocket_closed');
                if (!disposed)
                {
                    retry = setTimeout(connect, 2000);
                }
            };
            socket.onmessage = event =>
            {
                const row = JSON.parse(event.data);
                if (row.type === 'snapshot')
                {
                    healthRef.current.snapshot(row.data);
                    setModel(row.data);
                    if (row.data.stale || !healthRef.current.healthy())
                    {
                        disarm('snapshot_stale_or_mqtt_not_ready');
                    }
                    bootRef.current = row.data.state?.boot_id ?? null;
                    setLastStateAt(row.data.state_age_ms === null ? 0 : Date.now() - row.data.state_age_ms);
                    return;
                }
                if (row.type === 'state')
                {
                    healthRef.current.state();
                    setLastStateAt(Date.now());
                    if ((!row.data.running && sessionRef.current.active) || (bootRef.current && bootRef.current !== row.data.boot_id))
                    {
                        disarm(!row.data.running ? `esp_off_${row.data.stop_reason ?? 'unknown'}` : 'boot_changed');
                    }
                    bootRef.current = row.data.boot_id;
                }
                if (row.type === 'ack')
                {
                    traceControl('FRONT_ACK_RX', { command_id: row.data.command_id, boot_id: row.data.boot_id,
                        received_at_backend: row.received_at, accepted: row.data.accepted, running: row.data.running });
                    acksRef.current.set(row.data.command_id, row.data);
                    if (acksRef.current.size > 50)
                    {
                        acksRef.current.delete(acksRef.current.keys().next().value);
                    }
                    applyAck(row.data);
                }
                setModel(old => ({
                    ...old,
                    state: row.type === 'state' ? row.data : old.state,
                    last_ack: row.type === 'ack' ? row.data : old.last_ack,
                    timing: row.timing ?? old.timing,
                    history: row.type === 'state' && old.state?.boot_id !== row.data.boot_id ? [] :
                        row.type.startsWith('telemetry/') ? [...old.history, row].slice(-240) : old.history
                }));
            };
        }
        connect();
        const ticker = setInterval(() => setClock(Date.now()), 500);
        const renew = setInterval(() =>
        {
            for (const [id, record] of sessionRef.current.pending)
            {
                if (Date.now() - record.at > 5000)
                {
                    traceControl('FRONT_ACK_TIMEOUT', { command_id: id, wall_age_ms: Date.now() - record.at });
                    disarm('ack_wall_timeout');
                    setMessage(`Không nhận được ACK hợp lệ từ backend · ${id.slice(0, 8)}. Đã ngừng renew; xem trace theo command_id.`);
                    return;
                }
            }
            if (!healthRef.current.healthy())
            {
                if (sessionRef.current.active)
                {
                    disarm('state_stale_or_connection_unhealthy');
                }
                return;
            }
            if (sessionRef.current.active)
            {
                command('renew', true);
            }
        }, 1000);
        return () =>
        {
            disposed = true;
            clearTimeout(retry);
            clearInterval(ticker);
            clearInterval(renew);
            socket?.close();
        };
    }, []);

    function exportCsv()
    {
        const lines = ['source,type,received_at,t_device_ms,ax_m_s2,ay_m_s2,az_m_s2,rpm'];
        for (const row of model.history)
        {
            const d = row.data;
            lines.push([d.source, row.type, row.received_at, d.t_device_ms, d.ax, d.ay, d.az, d.rpm].join(','));
        }
        const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'resonanceguard-synthetic.csv';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return <main>
        <header><p className="eyebrow">RESONANCEGUARD / 03_IOT_INTEGRATION</p>
            <h1>Từ mạch Wokwi đến website</h1><p className="badge">SYNTHETIC · Dữ liệu mô phỏng · Chưa đánh giá cộng hưởng</p></header>
        <section><h2>Kết nối và trạng thái</h2><p>WebSocket: {wsReady ? 'đã nối' : 'mất kết nối'} · Broker: {!wsReady ? 'không xác định' : model.broker_connected ? 'đã nối' : 'chưa nối'}</p>
            <p>Subscribe backend: {!wsReady ? 'không xác định' : model.broker_subscribed ? 'đã nhận SUBACK' : 'chưa sẵn sàng'}</p>
            <p>ESP: <strong>{stale ? 'STALE / chưa có dữ liệu mới' : 'đang gửi'}</strong> · Boot: {model.state?.boot_id ?? '—'}</p>
            <p>Đầu ra theo ESP: <strong>{stale ? '— / STALE' : model.state?.running ? 'RUN' : 'OFF'}</strong> · PWM áp dụng: {stale ? '—' : ((model.state?.duty ?? 0) * 100).toFixed(1) + '%'}</p>
            <p>Lý do OFF gần nhất theo state ESP: {model.state?.stop_reason ?? 'chưa có log mới'}</p>
            {model.timing && <p>Khoảng nhận gián đoạn gần nhất: {(model.timing.wall_gap_ms / 1000).toFixed(2)} giây trên máy / {(model.timing.device_gap_ms / 1000).toFixed(2)} giây ESP. Có thể do giả lập chậm, tạm dừng hoặc mạng; ACK quá 5 giây vẫn bị từ chối.</p>}
            <p>RPM encoder mô phỏng: <strong>{rpm?.rpm == null ? '—' : rpm.rpm.toFixed(1)}</strong> · {rpmReading.stale ? 'STALE / chưa có bản tin RPM mới' : rpm?.quality}</p>
            <p>MPU6050: {imu?.ax == null ? '—' : [imu.ax, imu.ay, imu.az].map(v => v.toFixed(2)).join(' / ')} m/s² · {imuReading.stale ? 'STALE / chưa có bản tin gia tốc mới' : imu?.quality}</p>
            <small>Topic prefix: {model.prefix ?? '—'}</small></section>
        <section><h2>Điều khiển motor ảo</h2>
            <label>PWM yêu cầu: {duty}% <input type="range" min="0" max="80" value={duty} onChange={event =>
            {
                const value = Number(event.target.value);
                dutyRef.current = value;
                setDuty(value);
            }} /></label>
            <div className="buttons"><button disabled={stale || !model.broker_connected} onClick={() => command('start')}>START</button>
                <button onClick={() => command('stop')}>STOP</button>
                <button disabled={stale || !model.state?.running} onClick={() => command('set_duty')}>Áp dụng PWM</button>
                <button onClick={exportCsv}>Xuất CSV</button></div>
            <p aria-live="polite">{message}</p>
            <p>Lệnh web gần nhất: {lastCommandId ? <a href={`/api/commands/${encodeURIComponent(lastCommandId)}`} target="_blank" rel="noreferrer">{lastCommandId}</a> : '—'}</p>
            <small>Trang gửi renew mỗi giây sau ACK chạy. ESP tắt đầu ra khi hết lease 4 giây theo đồng hồ mô phỏng. Đổi PWM khi chạy cũng được gửi ở lần renew tiếp theo.</small></section>
        <p>Đồ thị bên dưới giữ lịch sử bản tin đã nhận, kể cả khi mất kết nối; không phải phép đo mới.</p>
        <div className="charts"><Chart rows={model.history} type="telemetry/vibration" fields={['ax', 'ay', 'az']} colors={['#6ce5cf', '#b8a0ff', '#ffbd78']} label="Gia tốc MPU6050 · m/s²" />
            <Chart rows={model.history} type="telemetry/rpm" fields={['rpm']} colors={['#6ce5cf']} label="Tốc độ từ xung · RPM" /></div>
        <footer>Motor và MPU6050 chưa liên kết bằng mô hình cơ học. Đường gia tốc phẳng ở trạng thái mặc định là bình thường.</footer>
    </main>;
}

createRoot(document.getElementById('root')).render(<App />);
