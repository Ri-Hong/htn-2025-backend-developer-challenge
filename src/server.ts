import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const { swaggerUi, swaggerSpec } = require("./swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req: Request, res: Response) => {
  res.send("Hack the North Backend is running with TypeScript!");
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *           nullable: true
 *         badge_code:
 *           type: string
 *         updated_at:
 *           type: string
 *           format: date-time
 *         scans:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Scan'
 *     Scan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         activityId:
 *           type: string
 *           format: uuid
 *         scanned_at:
 *           type: string
 *           format: date-time
 *         activity:
 *           $ref: '#/components/schemas/Activity'
 *     Activity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         category:
 *           type: string
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users with their scan history
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Get all users
app.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        scans: {
          include: {
            activity: true,
          },
        },
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get a single user
 *     description: Retrieve a user by their ID, email, or badge code
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: User's UUID
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: User's email
 *       - in: query
 *         name: badge_code
 *         schema:
 *           type: string
 *         description: User's badge code
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing identifier
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update user details
 *     description: Update a user's information using their ID, email, or badge code
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: User's UUID
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: User's email
 *       - in: query
 *         name: badge_code
 *         schema:
 *           type: string
 *         description: User's badge code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               badge_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Missing identifier or invalid update data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// Get a single user by id, email or badge_code
app.get("/user", async (req: Request, res: Response) => {
  try {
    const { email, badge_code, id } = req.query;

    if (!email && !badge_code && !id) {
      res.status(400).json({
        error: "Provide at least one identifier: id, email, or badge_code",
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email && { email: String(email) },
          badge_code && { badge_code: String(badge_code) },
          id && { id: String(id) },
        ].filter(Boolean) as any,
      },
      include: {
        scans: {
          include: { activity: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// Update user details
app.put("/user", async (req: Request, res: Response) => {
  try {
    const { email, badge_code, id } = req.query;
    const { name, email: newEmail, phone, badge_code: newBadgeCode } = req.body;

    if (!email && !badge_code && !id) {
      res.status(400).json({
        error: "Provide at least one identifier: id, email, or badge_code",
      });
      return;
    }

    // Create update data object with only allowed fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (newEmail !== undefined) updateData.email = newEmail;
    if (phone !== undefined) updateData.phone = phone;
    if (newBadgeCode !== undefined) updateData.badge_code = newBadgeCode;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        error:
          "Provide at least one valid field to update: name, email, phone, or badge_code",
      });
      return;
    }

    const userToUpdate = await prisma.user.findFirst({
      where: {
        OR: [
          email && { email: String(email) },
          badge_code && { badge_code: String(badge_code) },
          id && { id: String(id) },
        ].filter(Boolean) as any,
      },
    });

    if (!userToUpdate) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userToUpdate.id },
      data: updateData,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error updating user" });
  }
});

/**
 * @swagger
 * /scan/{badge_code}:
 *   post:
 *     summary: Create a new scan
 *     description: Record a new activity scan for a user
 *     tags: [Scans]
 *     parameters:
 *       - in: path
 *         name: badge_code
 *         required: true
 *         schema:
 *           type: string
 *         description: User's badge code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activity_name
 *               - activity_category
 *             properties:
 *               activity_name:
 *                 type: string
 *               activity_category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scan'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// Add a scan entry
app.post(
  "/scan/:badge_code",
  async (req: Request<{ badge_code: string }>, res: Response) => {
    try {
      const { badge_code } = req.params;
      const { activity_name, activity_category } = req.body;

      // Add validation for required fields
      if (!activity_name || !activity_category) {
        res
          .status(400)
          .json({ error: "activity_name and activity_category are required" });
        return;
      }

      const user = await prisma.user.findUnique({ where: { badge_code } });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Find or create activity
      const activity = await prisma.activity.upsert({
        where: { name: activity_name },
        update: {},
        create: {
          name: activity_name,
          category: activity_category,
          max_scans: null, // Default to unlimited scans
        },
      });

      // Check if user has reached scan limit for this activity
      if (activity.max_scans !== null) {
        const scanCount = await prisma.scan.count({
          where: {
            userId: user.id,
            activityId: activity.id,
          },
        });

        if (scanCount >= activity.max_scans) {
          res.status(400).json({
            error: `You have reached the maximum number of scans (${activity.max_scans}) for ${activity.name}`,
          });
          return;
        }
      }

      // Only create scan if we haven't returned due to limits
      const scan = await prisma.scan.create({
        data: {
          userId: user.id,
          activityId: activity.id,
          scanned_at: new Date(),
        },
        include: {
          activity: true,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { updated_at: new Date() },
      });

      res.json(scan);
    } catch (error) {
      console.error("Error adding scan:", error);
      res.status(500).json({ error: "Error adding scan" });
    }
  }
);

/**
 * @swagger
 * /scans:
 *   get:
 *     summary: Get aggregated scan data
 *     description: Retrieve scan statistics with optional filters
 *     tags: [Scans]
 *     parameters:
 *       - in: query
 *         name: min_frequency
 *         schema:
 *           type: integer
 *         description: Minimum number of scans
 *       - in: query
 *         name: max_frequency
 *         schema:
 *           type: integer
 *         description: Maximum number of scans
 *       - in: query
 *         name: activity_category
 *         schema:
 *           type: string
 *         description: Filter by activity category
 *     responses:
 *       200:
 *         description: Aggregated scan data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   activity_name:
 *                     type: string
 *                   activity_category:
 *                     type: string
 *                   frequency:
 *                     type: integer
 *       500:
 *         description: Server error
 */

// Get aggregated scan data with optional filters
app.get("/scans", async (req: Request, res: Response) => {
  try {
    const { min_frequency, max_frequency, activity_category } = req.query;

    // Convert query parameters to appropriate types
    const minFreq = min_frequency ? parseInt(String(min_frequency)) : undefined;
    const maxFreq = max_frequency ? parseInt(String(max_frequency)) : undefined;
    const category = activity_category ? String(activity_category) : undefined;

    // Build the where clause for activity filtering
    const where = category ? { activity: { category } } : undefined;

    // Get scan counts grouped by activity
    const scanCounts = await prisma.scan.groupBy({
      by: ["activityId"],
      _count: {
        id: true,
      },
      where,
      having: {
        id: {
          _count: {
            ...(minFreq !== undefined && { gte: minFreq }),
            ...(maxFreq !== undefined && { lte: maxFreq }),
          },
        },
      },
    });

    // Fetch activity details for matching scans
    const activities = await prisma.activity.findMany({
      where: {
        id: {
          in: scanCounts.map((count) => count.activityId),
        },
      },
    });

    // Combine the data
    const result = activities.map((activity) => ({
      activity_name: activity.name,
      activity_category: activity.category,
      frequency:
        scanCounts.find((count) => count.activityId === activity.id)?._count
          .id ?? 0,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching scan data:", error);
    res.status(500).json({ error: "Error fetching scan data" });
  }
});

/**
 * @swagger
 * /activity-timeline:
 *   get:
 *     summary: Get activity scan timeline
 *     description: Retrieve scan counts grouped by time intervals for a specific activity
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: activity_name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the activity to analyze
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, minute]
 *           default: hour
 *         description: Time grouping interval (hour or minute)
 *       - in: query
 *         name: start_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start time for analysis (ISO format)
 *       - in: query
 *         name: end_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End time for analysis (ISO format)
 *     responses:
 *       200:
 *         description: Timeline of scan counts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   time_period:
 *                     type: string
 *                   scan_count:
 *                     type: integer
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Server error
 */

app.get("/activity-timeline", async (req: Request, res: Response) => {
  const activityName = req.query.activity_name as string;

  // Add this check at the start of the route handler
  if (!activityName) {
    res.status(400).json({ error: "activity_name is required" });
    return;
  }

  try {
    const { interval = "hour", start_time, end_time } = req.query;

    // Build the where clause for the query
    const where: any = {
      activity: {
        name: String(activityName),
      },
    };

    // Add time filters if provided
    if (start_time || end_time) {
      where.scanned_at = {};
      if (start_time) where.scanned_at.gte = new Date(String(start_time));
      if (end_time) where.scanned_at.lte = new Date(String(end_time));
    }

    // Get all matching scans
    const scans = await prisma.scan.findMany({
      where,
      select: {
        scanned_at: true,
      },
      orderBy: {
        scanned_at: "asc",
      },
    });

    // Group scans by time period
    const timeGroups = new Map<string, number>();

    scans.forEach((scan) => {
      let periodKey: string;
      if (interval === "minute") {
        periodKey = scan.scanned_at.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
      } else {
        periodKey = scan.scanned_at.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      }

      timeGroups.set(periodKey, (timeGroups.get(periodKey) || 0) + 1);
    });

    // Convert to array and format response
    const timeline = Array.from(timeGroups.entries()).map(
      ([time_period, scan_count]) => ({
        time_period,
        scan_count,
      })
    );

    res.json(timeline);
  } catch (error) {
    console.error("Error fetching activity timeline:", error);
    res.status(500).json({ error: "Error fetching activity timeline" });
  }
});

/**
 * @swagger
 * /check-in/{badge_code}:
 *   post:
 *     summary: Check in an attendee
 *     description: Mark an attendee as checked in to the event
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: badge_code
 *         required: true
 *         schema:
 *           type: string
 *         description: User's badge code
 *     responses:
 *       200:
 *         description: Attendee checked in successfully
 *       404:
 *         description: User not found
 *       409:
 *         description: User already checked in
 *       500:
 *         description: Server error
 */

app.post("/check-in/:badge_code", async (req: Request, res: Response) => {
  try {
    const { badge_code } = req.params;

    const user = await prisma.user.findUnique({ where: { badge_code } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.checked_in) {
      res.status(409).json({ error: "User already checked in" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { badge_code },
      data: {
        checked_in: true,
        check_in_at: new Date(),
        check_out_at: null,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Error checking in user" });
  }
});

/**
 * @swagger
 * /check-out/{badge_code}:
 *   post:
 *     summary: Check out an attendee
 *     description: Mark an attendee as checked out from the event
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: badge_code
 *         required: true
 *         schema:
 *           type: string
 *         description: User's badge code
 *     responses:
 *       200:
 *         description: Attendee checked out successfully
 *       404:
 *         description: User not found
 *       409:
 *         description: User not checked in
 *       500:
 *         description: Server error
 */

app.post("/check-out/:badge_code", async (req: Request, res: Response) => {
  try {
    const { badge_code } = req.params;

    const user = await prisma.user.findUnique({ where: { badge_code } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.checked_in) {
      res.status(409).json({ error: "User is not checked in" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { badge_code },
      data: {
        checked_in: false,
        check_out_at: new Date(),
      },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Error checking out user" });
  }
});

/**
 * @swagger
 * /scan-badge/{scanner_id}/{scanned_badge_code}:
 *   post:
 *     summary: Record a badge scan between users
 *     description: Record when one user scans another user's badge
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: scanner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the user doing the scanning
 *       - in: path
 *         name: scanned_badge_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge code of the user being scanned
 *     responses:
 *       200:
 *         description: Badge scan recorded successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 */

app.post(
  "/scan-badge/:scanner_id/:scanned_badge_code",
  async (req: Request, res: Response) => {
    try {
      const { scanner_id, scanned_badge_code } = req.params;

      // Find both users
      const [scanner, scanned] = await Promise.all([
        prisma.user.findUnique({ where: { id: scanner_id } }),
        prisma.user.findUnique({ where: { badge_code: scanned_badge_code } }),
      ]);

      if (!scanner || !scanned) {
        res.status(404).json({ error: "One or both users not found" });
        return;
      }

      if (scanner.id === scanned.id) {
        res.status(400).json({ error: "Cannot scan your own badge" });
        return;
      }

      // Create or find the "badge-scan" activity
      const activity = await prisma.activity.upsert({
        where: { name: "badge-scan" },
        update: {},
        create: {
          name: "badge-scan",
          category: "social",
        },
      });

      // Record the scan
      const scan = await prisma.scan.create({
        data: {
          userId: scanner.id,
          activityId: activity.id,
          scanned_at: new Date(),
        },
        include: {
          activity: true,
          user: {
            select: {
              name: true,
              badge_code: true,
            },
          },
        },
      });

      res.json({
        message: "Badge scan recorded successfully",
        scanner: scanner.name,
        scanned: scanned.name,
        timestamp: scan.scanned_at,
      });
    } catch (error) {
      res.status(500).json({ error: "Error recording badge scan" });
    }
  }
);

/**
 * @swagger
 * /scanned-badges/{identifier}:
 *   get:
 *     summary: Get all badges scanned by a user
 *     description: Retrieve a list of all users whose badges were scanned by this user
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: User's ID (UUID) or badge code
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [id, badge_code]
 *         description: Type of identifier provided
 *     responses:
 *       200:
 *         description: List of scanned badges
 *       400:
 *         description: Invalid identifier type
 *       404:
 *         description: User not found
 */

app.get("/scanned-badges/:identifier", async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const { type } = req.query;

    if (type !== "id" && type !== "badge_code") {
      res
        .status(400)
        .json({ error: "Type must be either 'id' or 'badge_code'" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: type === "id" ? { id: identifier } : { badge_code: identifier },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const scans = await prisma.scan.findMany({
      where: {
        userId: user.id,
        activity: {
          name: "badge-scan",
        },
      },
      include: {
        user: {
          select: {
            name: true,
            badge_code: true,
          },
        },
      },
      orderBy: {
        scanned_at: "desc",
      },
    });

    res.json({
      user: user.name,
      scanned_count: scans.length,
      scans: scans.map((scan) => ({
        scanned_at: scan.scanned_at,
        scanner: scan.user,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching scanned badges" });
  }
});

// Export the app before starting the server
export default app;

// Start the server only if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
