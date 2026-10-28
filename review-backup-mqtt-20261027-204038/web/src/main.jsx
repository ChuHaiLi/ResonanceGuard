import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { latestReading } from './freshness.js';
import { ControlSession } from './control.js';

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
    const [wsReady, setWsReady] = useState(false);
    const [clock, setClock] = useState(Date.now());
    const [lastStateAt, setLastStateAt] = useState(0);
    const sessionRef = useRef(new ControlSession());
    const dutyRef = useRef(30);
    const acksRef = useRef(new Map());
    const bootRef = useRef(null);
    const healthRef = useRef(false);
    const stale = !lastStateAt || clock - lastStateAt > 4000 || !wsReady || !model.broker_connected;
    healthRef.current = !stale;
    const rpmReading = latestReading(model.history, 'telemetry/rpm', model.state?.boot_id, clock, !stale);
    const imuReading = latestReading(model.history, 'telemetry/vibration', model.state?.boot_id, clock, !stale);
    const rpm = rpmReading.stale ? null : rpmReading.data;
    const imu = imuReading.stale ? null : imuReading.data;

    function disarm()
    {
        sessionRef.current.disarm();
    }

    function applyAck(ack)
    {
        const record = sessionRef.current.acknowledge(ack, healthRef.current);
        if (!record)
        {
            return;
        }
        if (!record.silent || !ack.accepted)
        {
            setMessage(`ESP ${ack.accepted ? 'chấp nhận' : 'từ chối'}: ${ack.reason} · ${ack.command_id.slice(0, 8)}`);
        }
    }

    async function command(action, silent = false)
    {
        if (action === 'stop' || action === 'start')
        {
            disarm();
        }
        const epoch = sessionRef.current.epoch;
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
            if (!sessionRef.current.register(data.command_id, action, silent, epoch))
            {
                return;
            }
            if (!silent)
            {
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
                disarm();
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
            socket.onopen = () => setWsReady(true);
            socket.onclose = () =>
            {
                setWsReady(false);
                disarm();
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
                    setModel(row.data);
                    if (row.data.stale || !row.data.broker_connected)
                    {
                        disarm();
                    }
                    bootRef.current = row.data.state?.boot_id ?? null;
                    setLastStateAt(row.data.state_age_ms === null ? 0 : Date.now() - row.data.state_age_ms);
                    return;
                }
                if (row.type === 'state')
                {
                    setLastStateAt(Date.now());
                    if ((!row.data.running && sessionRef.current.active) || (bootRef.current && bootRef.current !== row.data.boot_id))
                    {
                        disarm();
                    }
                    bootRef.current = row.data.boot_id;
                }
                if (row.type === 'ack')
                {
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
                    history: row.type === 'state' && old.state?.boot_id !== row.data.boot_id ? [] :
                        row.type.startsWith('telemetry/') ? [...old.history, row].slice(-240) : old.history
                }));
            };
        }
        connect();
        const ticker = setInterval(() => setClock(Date.now()), 500);
        const renew = setInterval(() =>
        {
            if (!healthRef.current)
            {
                if (sessionRef.current.active)
                {
                    disarm();
                }
                return;
            }
            for (const [id, record] of sessionRef.current.pending)
            {
                if (Date.now() - record.at > 5000)
                {
                    disarm();
                    setMessage(`Không nhận được ESP ACK · ${id.slice(0, 8)}. Đã ngừng renew; kiểm đầu ra/RPM.`);
                    return;
                }
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
            <p>ESP: <strong>{stale ? 'STALE / chưa có dữ liệu mới' : 'đang gửi'}</strong> · Boot: {model.state?.boot_id ?? '—'}</p>
            <p>Đầu ra theo ESP: <strong>{stale ? '— / STALE' : model.state?.running ? 'RUN' : 'OFF'}</strong> · PWM áp dụng: {stale ? '—' : ((model.state?.duty ?? 0) * 100).toFixed(1) + '%'}</p>
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
            <p aria-live="polite">{message}</p><small>Trang gửi renew mỗi giây sau ACK chạy. ESP tắt đầu ra khi hết lease 4 giây theo đồng hồ mô phỏng. Đổi PWM khi chạy cũng được gửi ở lần renew tiếp theo.</small></section>
        <p>Đồ thị bên dưới giữ lịch sử bản tin đã nhận, kể cả khi mất kết nối; không phải phép đo mới.</p>
        <div className="charts"><Chart rows={model.history} type="telemetry/vibration" fields={['ax', 'ay', 'az']} colors={['#6ce5cf', '#b8a0ff', '#ffbd78']} label="Gia tốc MPU6050 · m/s²" />
            <Chart rows={model.history} type="telemetry/rpm" fields={['rpm']} colors={['#6ce5cf']} label="Tốc độ từ xung · RPM" /></div>
        <footer>Motor và MPU6050 chưa liên kết bằng mô hình cơ học. Đường gia tốc phẳng ở trạng thái mặc định là bình thường.</footer>
    </main>;
}

createRoot(document.getElementById('root')).render(<App />);
