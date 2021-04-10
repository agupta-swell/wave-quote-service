export class CostBreakdown {
    public solarCost: number;
    public storageCost: number;
    public laborCost: number;

    public get totalCost() {
        return this.solarCost + this.storageCost + this.laborCost;
    }
}