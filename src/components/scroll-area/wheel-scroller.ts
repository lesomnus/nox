const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

// One logical target preserves fractional input and never overshoots a limit.
// Written offsets are tracked separately because native device pixels can round.
export class WheelScroller {
  private x: number;
  private y: number;
  private targetX: number;
  private targetY: number;
  private writtenX: number;
  private writtenY: number;
  private frame = 0;
  private time = 0;

  constructor(
    private el: HTMLElement,
    private duration: () => number,
  ) {
    this.x = this.targetX = this.writtenX = el.scrollLeft;
    this.y = this.targetY = this.writtenY = el.scrollTop;
  }

  cancel() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.x = this.targetX = this.writtenX = this.el.scrollLeft;
    this.y = this.targetY = this.writtenY = this.el.scrollTop;
  }

  scrollBy(dx: number, dy: number) {
    if (this.movedExternally()) this.cancel();
    const beforeX = this.targetX,
      beforeY = this.targetY;
    // A reversal starts from the visible position instead of working through
    // the unfinished movement in the old direction.
    if (dx * (this.targetX - this.x) < 0) this.targetX = this.x;
    if (dy * (this.targetY - this.y) < 0) this.targetY = this.y;
    this.targetX = clamp(
      this.targetX + dx,
      this.el.scrollWidth - this.el.clientWidth,
    );
    this.targetY = clamp(
      this.targetY + dy,
      this.el.scrollHeight - this.el.clientHeight,
    );
    if (this.duration() <= 0 || this.closeEnough()) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.x = this.targetX;
      this.y = this.targetY;
      this.write();
    } else if (!this.frame) {
      this.time = performance.now();
      this.frame = requestAnimationFrame(this.advance);
    }
    return beforeX !== this.targetX || beforeY !== this.targetY;
  }

  private movedExternally() {
    return (
      this.el.scrollLeft !== this.writtenX ||
      this.el.scrollTop !== this.writtenY
    );
  }

  private closeEnough() {
    return (
      Math.abs(this.targetX - this.x) <= 0.5 &&
      Math.abs(this.targetY - this.y) <= 0.5
    );
  }

  private write() {
    this.el.scrollTo({ left: this.x, top: this.y, behavior: "instant" });
    this.writtenX = this.el.scrollLeft;
    this.writtenY = this.el.scrollTop;
  }

  private advance = (now: number) => {
    this.frame = 0;
    if (this.movedExternally()) {
      this.cancel();
      return;
    }
    this.targetX = clamp(
      this.targetX,
      this.el.scrollWidth - this.el.clientWidth,
    );
    this.targetY = clamp(
      this.targetY,
      this.el.scrollHeight - this.el.clientHeight,
    );
    const ms = this.duration();
    const weight =
      ms <= 0
        ? 1
        : 1 - Math.exp(-Math.max(0, Math.min(64, now - this.time)) / ms);
    this.time = now;
    this.x += (this.targetX - this.x) * weight;
    this.y += (this.targetY - this.y) * weight;
    if (this.closeEnough()) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
    this.write();
    if (this.x !== this.targetX || this.y !== this.targetY)
      this.frame = requestAnimationFrame(this.advance);
  };
}
