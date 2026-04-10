import { prisma } from "../lib/prisma.js";

// utils/approvalHelper.js

// ✅ 1. Check if approval ON for this company+page
export async function isApprovalEnabled(companyId, pageId) {
  const config = await prisma.approvalConfig.findUnique({
    where: {
      companyId_pageId: {
        companyId: parseInt(companyId),
        pageId: parseInt(pageId),
      },
    },
  });
  return { enabled: config?.active === true, config };
}

// ✅ 2. Create PENDING log when record is created
export async function createApprovalLog(
  tx,
  companyId,
  pageId,
  referenceId,
  referencePage,
) {
  const config = await prisma.approvalConfig.findUnique({
    where: {
      companyId_pageId: {
        companyId: parseInt(companyId),
        pageId: parseInt(pageId),
      },
    },
  });

  if (!config?.active) return null; // approval not enabled, skip

  return await tx.approvalLog.create({
    data: {
      approvalConfigId: config.id,
      referenceId: parseInt(referenceId),
      referencePage,
      status: "PENDING",
    },
  });
}

// ✅ 3. Get approval status of a record
export async function getApprovalLog(referenceId, referencePage) {
  return await prisma.approvalLog.findFirst({
    where: {
      referenceId: parseInt(referenceId),
      referencePage,
    },
    include: {
      ApprovalConfig: true,
      ApprovedBy: { select: { id: true, username: true } },
      RejectedBy: { select: { id: true, username: true } },
    },
  });
}

// ✅ 4. Check if logged-in user can approve
export async function canUserApprove(companyId, pageId, userId) {
  const config = await prisma.approvalConfig.findUnique({
    where: {
      companyId_pageId: {
        companyId: parseInt(companyId),
        pageId: parseInt(pageId),
      },
    },
  });

  if (!config?.active) return false;

  if (config.approverType === "USER") {
    return config.approverUserId === parseInt(userId);
  }

  if (config.approverType === "ROLE") {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { roleId: true },
    });
    return user?.roleId === config.approverRoleId;
  }

  return false;
}

// ✅ 5. Approve
export async function approveRecord(
  referenceId,
  referencePage,
  approvedById,
  remarks,
) {
  const log = await prisma.approvalLog.findFirst({
    where: { referenceId: parseInt(referenceId), referencePage },
  });

  if (!log) return { statusCode: 1, message: "Approval log not found" };
  if (log.status === "APPROVED")
    return { statusCode: 1, message: "Already approved" };

  return await prisma.approvalLog.update({
    where: { id: log.id },
    data: {
      status: "APPROVED",
      approvedById: parseInt(approvedById),
      approvedAt: new Date(),
      remarks: remarks || null,
    },
  });
}

// ✅ 6. Reject
export async function rejectRecord(
  referenceId,
  referencePage,
  rejectedById,
  remarks,
) {
  const log = await prisma.approvalLog.findFirst({
    where: { referenceId: parseInt(referenceId), referencePage },
  });

  if (!log) return { statusCode: 1, message: "Approval log not found" };

  return await prisma.approvalLog.update({
    where: { id: log.id },
    data: {
      status: "REJECTED",
      rejectedById: parseInt(rejectedById),
      rejectedAt: new Date(),
      remarks: remarks || null,
    },
  });
}

////////////////////////////////

// GET all approval configs for a company (Settings Screen)
export async function getApprovalConfigs(companyId) {
  const pages = await prisma.page.findMany({
    where: {
      active: true,
      type: { in: ["Transactions"] }, // only transaction pages need approval
    },
    include: {
      PageGroup: true,
      ApprovalConfig: {
        where: { companyId: parseInt(companyId) },
        include: {
          ApproverRole: { select: { id: true, name: true } },
          ApproverUser: { select: { id: true, username: true } },
        },
      },
    },
  });

  // Group by PageGroup for UI
  const grouped = pages.reduce((acc, page) => {
    const groupName = page.PageGroup?.name || "Other";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push({
      pageId: page.id,
      pageName: page.name,
      pageGroupId: page.pageGroupId,
      config: page.ApprovalConfig[0] || null, // null = not configured
    });
    return acc;
  }, {});

  return { statusCode: 0, data: grouped };
}

// SAVE / UPDATE approval config for a page
export async function saveApprovalConfig(companyId, pageId, body) {
  const { active, approverType, approverRoleId, approverUserId } = body;

  const data = await prisma.approvalConfig.upsert({
    where: {
      companyId_pageId: {
        companyId: parseInt(companyId),
        pageId: parseInt(pageId),
      },
    },
    create: {
      companyId: parseInt(companyId),
      pageId: parseInt(pageId),
      active: active ?? false,
      approverType,
      approverRoleId: approverRoleId ? parseInt(approverRoleId) : null,
      approverUserId: approverUserId ? parseInt(approverUserId) : null,
    },
    update: {
      active: active ?? false,
      approverType,
      approverRoleId: approverRoleId ? parseInt(approverRoleId) : null,
      approverUserId: approverUserId ? parseInt(approverUserId) : null,
    },
  });

  return { statusCode: 0, data };
}

// Toggle ON/OFF only
export async function toggleApprovalConfig(companyId, pageId, active) {
  const data = await prisma.approvalConfig.upsert({
    where: {
      companyId_pageId: {
        companyId: parseInt(companyId),
        pageId: parseInt(pageId),
      },
    },
    create: {
      companyId: parseInt(companyId),
      pageId: parseInt(pageId),
      active,
    },
    update: { active },
  });
  return { statusCode: 0, data };
}

//////// Sample ///////////

// In PO create
async function createPO(body) {
  const { companyId, ...rest } = body;
  const PO_PAGE_ID = 80; // your Purchase Order page id

  const po = await prisma.$transaction(async (tx) => {
    const created = await tx.po.create({ data: { ...rest } });

    // ✅ Auto-create PENDING approval log if enabled
    await createApprovalLog(
      tx,
      companyId,
      PO_PAGE_ID,
      created.id,
      "PURCHASE ORDER",
    );

    return created;
  });

  return { statusCode: 0, data: po };
}

// In Purchase Inward create — block if PO not approved
async function createInward(body) {
  const { companyId, poId } = body;
  const PO_PAGE_ID = 80;

  // ✅ Only check if approval is enabled
  const { enabled } = await isApprovalEnabled(companyId, PO_PAGE_ID);

  if (enabled && poId) {
    const log = await getApprovalLog(poId, "PURCHASE ORDER");
    if (!log || log.status !== "APPROVED") {
      return {
        statusCode: 1,
        message: `Purchase Order approval is pending. Please get PO approved before inward.`,
      };
    }
  }

  // proceed with inward...
}

///////////////

// routes
router.get("/approvalConfig/:companyId", getConfigs);
router.post("/approvalConfig/:companyId/:pageId", saveConfig);
router.patch("/approvalConfig/:companyId/:pageId/toggle", toggleConfig);
router.post("/approve/:referencePage/:referenceId", approve);
router.post("/reject/:referencePage/:referenceId", reject);

// controllers
async function approve(req, res) {
  try {
    const { referencePage, referenceId } = req.params;
    const { userId, remarks, companyId, pageId } = req.body;

    // ✅ Check if this user is allowed to approve
    const allowed = await canUserApprove(companyId, pageId, userId);
    if (!allowed) {
      return res.json({
        statusCode: 1,
        message: "You are not authorized to approve this.",
      });
    }

    const data = await approveRecord(
      referenceId,
      referencePage,
      userId,
      remarks,
    );
    res.json({ statusCode: 0, data });
  } catch (err) {
    res.json({ statusCode: 1, message: err.message });
  }
}

async function reject(req, res) {
  try {
    const { referencePage, referenceId } = req.params;
    const { userId, remarks, companyId, pageId } = req.body;

    const allowed = await canUserApprove(companyId, pageId, userId);
    if (!allowed) {
      return res.json({
        statusCode: 1,
        message: "You are not authorized to reject this.",
      });
    }

    const data = await rejectRecord(
      referenceId,
      referencePage,
      userId,
      remarks,
    );
    res.json({ statusCode: 0, data });
  } catch (err) {
    res.json({ statusCode: 1, message: err.message });
  }
}
