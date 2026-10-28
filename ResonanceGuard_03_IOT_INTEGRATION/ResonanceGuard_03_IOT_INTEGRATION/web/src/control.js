export class ControlSession
{
    active = false;
    epoch = 0;
    pending = new Map();
    lastAckDecision = 'none';

    disarm()
    {
        this.active = false;
        ++this.epoch;
        this.pending.clear();
    }

    register(id, action, silent, epoch, now = Date.now())
    {
        if (epoch !== this.epoch)
        {
            return false;
        }
        this.pending.set(id, { action, silent, epoch, at: now });
        return true;
    }

    acknowledge(ack, healthy, now = Date.now())
    {
        const record = this.pending.get(ack.command_id);
        if (!record || record.epoch !== this.epoch || now - record.at > 5000)
        {
            this.lastAckDecision = !record ? 'no_matching_pending_or_early_ack' :
                record.epoch !== this.epoch ? 'old_control_epoch' : 'ack_wall_timeout';
            return null;
        }
        this.pending.delete(ack.command_id);
        if (!ack.accepted || !ack.running || !healthy)
        {
            this.active = false;
            this.lastAckDecision = !healthy ? 'matched_but_unhealthy_no_renew' :
                !ack.accepted ? 'device_rejected' : 'device_off';
        }
        else if (record.action === 'start')
        {
            this.active = true;
            this.lastAckDecision = 'start_armed';
        }
        else
        {
            this.lastAckDecision = this.active ? 'matched_active' : 'matched_does_not_arm';
        }
        return record;
    }
}

// Update in WebSocket callbacks, not during a later React render.
export class ConnectionHealth
{
    ws = false;
    broker = false;
    subscribed = false;
    stateAt = 0;

    snapshot(data, now = Date.now())
    {
        this.broker = Boolean(data.broker_connected);
        this.subscribed = data.broker_subscribed !== false;
        this.stateAt = data.state_age_ms == null ? 0 : now - data.state_age_ms;
    }

    state(now = Date.now())
    {
        this.stateAt = now;
    }

    healthy(now = Date.now())
    {
        return this.ws && this.broker && this.subscribed && this.stateAt > 0 && now - this.stateAt <= 4000;
    }
}
