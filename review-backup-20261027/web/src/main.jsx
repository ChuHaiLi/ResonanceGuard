import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

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
    const active = useRef(false);
    const dutyRef = useRef(30);
    const commandRef = useRef(null);
    const acksRef = useRef(new Map());
    const bootRef = useRef(null);
    const latest = type => model.history.filter(row => row.type === type).at(-1)?.data;
    const rpm = latest('telemetry/rpm');
    const imu = latest('telemetry/vibration');
    const stale = !lastStateAt || clock - lastStateAt > 4000 || !wsReady;

    function applyAck(ack)
    {
        setMessage(`ESP ${ack.accepted ? 'chấp nhận' : 'từ chối'}: ${ack.reason} · ${ack.command_id.slice(0, 8)}`);
        active.current = Boolean(ack.accepted && ack.running);
    }

    async function command(action, silent = false)
    {
        try
        {
            const response = await fetch('/api/motor', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, duty: dutyRef.current / 100 })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            if (!silent)
            {
                commandRef.current = data.command_id;
                setMessage(`Đã gửi ${action}; chờ ESP ACK · ${data.command_id.slice(0, 8)}`);
                const earlyAck = acksRef.current.get(data.command_id);
                if (earlyAck) applyAck(earlyAck);
            }
        }
        catch (error)
        {
            active.current = false;
            setMessage(error.message);
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
                active.current = false;
                if (!disposed) retry = setTimeout(connect, 2000);
            };
            socket.onmessage = event =>
            {
                const row = JSON.parse(event.data);
                if (row.type === 'snapshot')
                {
                    setModel(row.data);
                    setLastStateAt(row.data.state_age_ms === null ? 0 : Date.now() - row.data.state_age_ms);
                    return;
                }
                if (row.type === 'state')
                {
                    setLastStateAt(Date.now());
                    if (!row.data.running || (bootRef.current && bootRef.current !== row.data.boot_id))
                    {
                        active.current = false;
                    }
                    bootRef.current = row.data.boot_id;
                }
                if (row.type === 'ack')
                {
                    acksRef.current.set(row.data.command_id, row.data);
                    if (acksRef.current.size > 50) acksRef.current.delete(acksRef.current.keys().next().value);
                    if (row.data.command_id === commandRef.current) applyAck(row.data);
                }
                setModel(old => ({
                    ...old,
                    state: row.type === 'state' ? row.data : old.state,
                    last_ack: row.type === 'ack' ? row.data : old.last_ack,
                    history: row.type.startsWith('telemetry/') ? [...old.history, row].slice(-240) : old.history
                }));
            };
        }
        connect();
        const ticker = setInterval(() => setClock(Date.now()), 500);
        const renew = setInterval(() =>
        {
            if (active.current) command('renew', true);
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
        <section><h2>Kết nối và trạng thái</h2><p>WebSocket: {wsReady ? 'đã nối' : 'mất kết nối'} · Broker: {model.broker_connected ? 'đã nối' : 'chưa nối'}</p>
            <p>ESP: <strong>{stale ? 'STALE / chưa có dữ liệu mới' : 'đang gửi'}</strong> · Boot: {model.state?.boot_id ?? '—'}</p>
            <p>Motor theo ESP: <strong>{model.state?.running ? 'RUN' : 'OFF'}</strong> · PWM áp dụng: {((model.state?.duty ?? 0) * 100).toFixed(0)}%</p>
            <p>RPM encoder mô phỏng: <strong>{rpm?.rpm == null ? '—' : rpm.rpm.toFixed(1)}</strong> · {rpm?.quality ?? 'chưa có xung'}</p>
            <p>MPU6050: {imu?.ax == null ? 'chưa đọc được' : [imu.ax, imu.ay, imu.az].map(v => v.toFixed(2)).join(' / ')} m/s²</p>
            <small>Topic prefix: {model.prefix ?? '—'}</small></section>
        <section><h2>Điều khiển motor ảo</h2>
            <label>PWM yêu cầu: {duty}% <input type="range" min="0" max="80" value={duty} onChange={event =>
            {
                const value = Number(event.target.value);
                dutyRef.current = value;
                setDuty(value);
            }} /></label>
            <div className="buttons"><button disabled={stale || !model.broker_connected} onClick={() => command('start')}>START</button>
                <button onClick={() => { active.current = false; command('stop'); }}>STOP</button>
                <button disabled={stale} onClick={() => command('set_duty')}>Áp dụng PWM</button>
                <button onClick={exportCsv}>Xuất CSV</button></div>
            <p aria-live="polite">{message}</p><small>Trang gửi renew mỗi giây sau ACK chạy. ESP tắt đầu ra khi hết lease 4 giây theo đồng hồ mô phỏng. Đổi PWM khi chạy cũng được gửi ở lần renew tiếp theo.</small></section>
        <div className="charts"><Chart rows={model.history} type="telemetry/vibration" fields={['ax', 'ay', 'az']} colors={['#6ce5cf', '#b8a0ff', '#ffbd78']} label="Gia tốc MPU6050 · m/s²" />
            <Chart rows={model.history} type="telemetry/rpm" fields={['rpm']} colors={['#6ce5cf']} label="Tốc độ từ xung · RPM" /></div>
        <footer>Motor và MPU6050 chưa liên kết bằng mô hình cơ học. Đường gia tốc phẳng ở trạng thái mặc định là bình thường.</footer>
    </main>;
}

createRoot(document.getElementById('root')).render(<App />);
