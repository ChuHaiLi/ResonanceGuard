export class ControlSession
{
    active = false;
    epoch = 0;
    pending = new Map();

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
            return null;
        }
        this.pending.delete(ack.command_id);
        if (!ack.accepted || !ack.running || !healthy)
        {
            this.active = false;
        }
        else if (record.action === 'start')
        {
            this.active = true;
        }
        return record;
    }
}
