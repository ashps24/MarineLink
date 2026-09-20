'use strict';

/**
 * One entry per Data Store table. Adding a resource is adding an entry here —
 * the route layer in index.js never changes.
 *
 * `fields` maps the camelCase API field name (what the frontend already
 * speaks — these match the TypeScript models in src/types/) to the Data
 * Store column name. Columns are PascalCase because Data Store rejects a
 * handful of reserved words as column names in camelCase form too
 * ("priority" is reserved — see UrgencyLevel below); the mapping keeps that
 * entirely on this side of the API.
 */
const RESOURCES = {
  dealers: {
    table: 'Dealers',
    fields: {
      name: 'Name',
      status: 'Status',
      region: 'Region',
      primaryContactName: 'PrimaryContactName',
      primaryContactEmail: 'PrimaryContactEmail',
      primaryContactPhone: 'PrimaryContactPhone',
      address: 'Address',
      partnerSince: 'PartnerSince',
      logoInitial: 'LogoInitial',
    },
    booleanFields: [],
    datetimeFields: [],
  },

  customers: {
    table: 'Customers',
    fields: {
      name: 'Name',
      status: 'Status',
      organizationName: 'OrganizationName',
      primaryContactName: 'PrimaryContactName',
      primaryContactEmail: 'PrimaryContactEmail',
      primaryContactPhone: 'PrimaryContactPhone',
      address: 'Address',
      dealerId: 'DealerId',
      customerSince: 'CustomerSince',
    },
    booleanFields: [],
    datetimeFields: [],
  },

  equipment: {
    table: 'Equipment',
    fields: {
      name: 'Name',
      equipmentType: 'EquipmentType',
      productId: 'ProductId',
      model: 'Model',
      serialNumber: 'SerialNumber',
      currentStatus: 'CurrentStatus',
      customerId: 'CustomerId',
      dealerId: 'DealerId',
      liftCapacityTons: 'LiftCapacityTons',
      commissionedDate: 'CommissionedDate',
      location: 'Location',
      imageUrl: 'ImageUrl',
      lastInspectionDate: 'LastInspectionDate',
      serviceContractStatus: 'ServiceContractStatus',
      serviceContractExpiresOn: 'ServiceContractExpiresOn',
    },
    booleanFields: [],
    datetimeFields: [],
  },

  'service-requests': {
    table: 'ServiceRequests',
    fields: {
      referenceNumber: 'ReferenceNumber',
      subject: 'Subject',
      status: 'Status',
      // Data Store rejects a column literally named "priority" as a reserved
      // keyword — UrgencyLevel is the same field under the hood.
      priority: 'UrgencyLevel',
      assignedTeam: 'AssignedTeam',
      equipmentId: 'EquipmentId',
      customerId: 'CustomerId',
      dealerId: 'DealerId',
      summary: 'Summary',
      kind: 'Kind',
      unitOutOfService: 'UnitOutOfService',
      // When the request was actually raised, as distinct from when the row
      // was written. Seeded history has a raised date far older than its
      // insert time, and every age, ageing and resolution figure has to be
      // measured from the former.
      raisedAt: 'RaisedAt',
      statusChangedAt: 'StatusChangedAt',
      resolvedAt: 'ResolvedAt',
      partsEtaDate: 'PartsEtaDate',
    },
    booleanFields: ['unitOutOfService'],
    datetimeFields: ['raisedAt', 'statusChangedAt', 'resolvedAt'],
  },

  /**
   * Every state change a request has been through, plus the conversation
   * around it. Status history, reassignment and comments share one table
   * because they share one timeline: a reader wants them interleaved, and
   * splitting them would mean merging them back on every read.
   */
  'service-events': {
    table: 'ServiceEvents',
    fields: {
      requestId: 'RequestId',
      eventKind: 'EventKind',
      fromValue: 'FromValue',
      toValue: 'ToValue',
      note: 'Note',
      actorName: 'ActorName',
      actorRole: 'ActorRole',
      actorEmail: 'ActorEmail',
      occurredAt: 'OccurredAt',
    },
    booleanFields: [],
    datetimeFields: ['occurredAt'],
  },

  /**
   * Who may sign in, and as what. Catalyst Authentication owns the
   * credential; this table owns the application role and the organization a
   * person is scoped to, keyed by the email Catalyst authenticates.
   */
  'app-users': {
    table: 'AppUsers',
    fields: {
      email: 'Email',
      fullName: 'FullName',
      title: 'Title',
      userRole: 'UserRole',
      organizationId: 'OrganizationId',
      organizationName: 'OrganizationName',
      accountStatus: 'AccountStatus',
    },
    booleanFields: [],
    datetimeFields: [],
  },
};

module.exports = { RESOURCES };
