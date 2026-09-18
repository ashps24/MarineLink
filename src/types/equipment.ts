export type EquipmentStatus = "active" | "maintenance" | "inactive" | "retired";

export interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  /**
   * The catalogue product this unit is an instance of. Model designation,
   * rated capacity and product photography are derived from it, so a fielded
   * unit can never drift from the product line it belongs to.
   */
  productId: string;
  model: string;
  serialNumber: string;
  currentStatus: EquipmentStatus;
  customerId?: string;
  dealerId?: string;
  liftCapacityTons?: number;
  commissionedDate?: string;
  location?: string;
  imageUrl?: string;
  /**
   * When an inspection was last *reported* for this unit. Absent means no
   * record reached MarineLink — which is a reporting gap, not evidence the
   * machine is uninspected. The UI must keep those two things apart.
   */
  lastInspectionDate?: string;
}
