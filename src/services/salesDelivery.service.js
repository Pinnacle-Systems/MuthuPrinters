// model SalesDelivery {
//   id                Int                  @id @default(autoincrement())
//   docId             String
//   docDate           DateTime?
//   createdAt         DateTime             @default(now())
//   updatedAt         DateTime             @updatedAt

//   createdById       Int?
//   createdBy         User?                @relation("salesDeliveryCreatedBy", fields: [createdById], references: [id])

//   updatedById       Int?
//   updatedBy         User?                @relation("salesDeliveryUpdatedBy", fields: [updatedById], references: [id])

//   branchId          Int?
//   Branch            Branch?              @relation(fields: [branchId], references: [id])

//   customerId        Int?
//   Customer          Party?               @relation(fields: [customerId], references: [id])

//   orderEntryId      Int?
//   OrderEntry        OrderEntry?          @relation(fields: [orderEntryId], references: [id])

//   dcNo              String?
//   vehicleNo         String?
//   deliveryType      String?
  
//   remarks           String?
//    discountType        String?
//   discountValue       Float?
//   TaxTemplate         TaxTemplate?       @relation(fields: [taxTemplateId], references: [id], onDelete: Cascade)
//   taxTemplateId       Int?

// }

// model SalesDeliveryItem {
//   id                   Int              @id @default(autoincrement())

//   salesDeliveryId      Int
//   SalesDelivery        SalesDelivery    @relation(fields: [salesDeliveryId], references: [id], onDelete: Cascade)

//   styleItemId          Int?
//   StyleItem            StyleItem?       @relation(fields: [styleItemId], references: [id])

//   color                String?


//   deliveredQty         Float?

//   rate                 Float?
//   amount               Float?
//    discountType         String?
//   discountValue        Float?
//   taxPercent           Float?

// }