export class GeneratedSolarSystem {
    constructor(
        private numberOfPanelsVal: number,
        private panelSTCRatingVal: number = 1,
    ) { }

    public get numberOfPanels() {
        return this.numberOfPanelsVal;
    }

    public get panelSTCRating() {
        return this.panelSTCRatingVal;
    }

    public get capacityKW() {
        return (this.numberOfPanels * this.panelSTCRating) / 1000;
    }
}