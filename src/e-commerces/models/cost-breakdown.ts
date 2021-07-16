export class CostBreakdown {
    public solarCost: number;
    public storageCost: number;
    public laborCost: number;
    public markupRate: number;

    public get totalCost() {
        return (this.solarCost + this.storageCost + this.laborCost) * (1.0 + this.markupRate);
    }
}