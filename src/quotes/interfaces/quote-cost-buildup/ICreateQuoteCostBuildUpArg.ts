import {
  IAdderSchema,
  IAncillaryEquipmentSchema,
  IBalanceOfSystemSchema,
  IInverterSchema,
  ISolarPanelArraySchema,
  IStorageSchema,
  ISoftCostSchema,
  ILaborCostSchema,
} from 'src/system-designs/system-design.schema';

export interface ICreateQuoteCostBuildUpArg {
  panelArray: Pick<
    ISolarPanelArraySchema,
    'numberOfPanels' | 'panelModelDataSnapshot' | 'panelModelSnapshotDate' | 'panelModelId'
  >[];
  inverters: Pick<
    IInverterSchema,
    'quantity' | 'inverterModelDataSnapshot' | 'inverterModelSnapshotDate' | 'inverterModelId'
  >[];
  storage: Pick<
    IStorageSchema,
    'quantity' | 'storageModelDataSnapshot' | 'storageModelSnapshotDate' | 'storageModelId'
  >[];
  adders: Pick<IAdderSchema, 'quantity' | 'adderModelDataSnapshot' | 'adderModelSnapshotDate' | 'adderId'>[];
  balanceOfSystems: Pick<
    IBalanceOfSystemSchema,
    'balanceOfSystemModelDataSnapshot' | 'balanceOfSystemSnapshotDate' | 'balanceOfSystemId'
  >[];
  ancillaryEquipments: Pick<
    IAncillaryEquipmentSchema,
    'quantity' | 'ancillaryEquipmentModelDataSnapshot' | 'ancillaryEquipmentModelDataSnapshotDate' | 'ancillaryId'
  >[];
  softCosts: Pick<ISoftCostSchema, 'quantity' | 'softCostDataSnapshot' | 'softCostSnapshotDate' | 'softCostId'>[];
  laborCosts: Pick<ILaborCostSchema, 'laborCostId' | 'laborCostDataSnapshot' | 'laborCostSnapshotDate' | 'quantity'>[];
}
