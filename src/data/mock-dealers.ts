import type { Dealer } from "@/types";
import { mockCustomers } from "./mock-customers";
import { mockEquipment } from "./mock-equipment";
import { mockServiceRequests } from "./mock-service-requests";
import { countEquipmentForDealer, countOpenForDealer } from "./derive";

/** Dealer records without the counts, which are derived below. */
type DealerBase = Omit<Dealer, "customerCount" | "equipmentCount" | "openServiceRequestCount">;

const dealerBase: DealerBase[] = [
  {
    id: "dealer-1",
    name: "Pacific Marine Equipment Co.",
    status: "active",
    region: "Pacific Northwest",
    primaryContactName: "Renee Ashford",
    primaryContactEmail: "renee.ashford@pacificmarineequip.com",
    primaryContactPhone: "(206) 555-0142",
    address: "4120 Harbor Ave SW, Seattle, WA 98116",
    partnerSince: "2014-03-11",
    logoInitial: "P",
  },
  {
    id: "dealer-2",
    name: "Gulf Coast Travelift Services",
    status: "active",
    region: "Gulf Coast",
    primaryContactName: "Marcus Deluca",
    primaryContactEmail: "marcus.deluca@gulfcoasttravelift.com",
    primaryContactPhone: "(813) 555-0198",
    address: "2210 Causeway Blvd, Tampa, FL 33619",
    partnerSince: "2011-07-22",
    logoInitial: "G",
  },
  {
    id: "dealer-3",
    name: "Atlantic Boatworks Group",
    status: "active",
    region: "Northeast",
    primaryContactName: "Colin Whitfield",
    primaryContactEmail: "colin.whitfield@atlanticboatworks.com",
    primaryContactPhone: "(207) 555-0176",
    address: "88 Commercial St, Portland, ME 04101",
    partnerSince: "2017-05-02",
    logoInitial: "A",
  },
  {
    id: "dealer-4",
    name: "Carolina Marine Systems",
    status: "pending",
    region: "Southeast",
    primaryContactName: "Danielle Broussard",
    primaryContactEmail: "danielle.broussard@carolinamarinesys.com",
    primaryContactPhone: "(843) 555-0134",
    address: "715 Concord St, Charleston, SC 29401",
    partnerSince: "2023-09-18",
    logoInitial: "C",
  },
  {
    id: "dealer-5",
    name: "Great Lakes Marine Solutions",
    status: "active",
    region: "Great Lakes",
    primaryContactName: "Owen Kaczmarek",
    primaryContactEmail: "owen.kaczmarek@greatlakesmarinesolutions.com",
    primaryContactPhone: "(231) 555-0187",
    address: "620 Bay St, Traverse City, MI 49684",
    partnerSince: "2016-01-29",
    logoInitial: "G",
  },
];

export const mockDealers: Dealer[] = dealerBase.map((dealer) => ({
  ...dealer,
  customerCount: mockCustomers.filter((customer) => customer.dealerId === dealer.id).length,
  equipmentCount: countEquipmentForDealer(mockEquipment, dealer.id),
  openServiceRequestCount: countOpenForDealer(mockServiceRequests, dealer.id),
}));
