import { Hono } from "https://deno.land/x/hono@v4.0.0/mod.ts";
import { cors } from "https://deno.land/x/hono@v4.0.0/middleware/cors/index.ts";
import { logger } from "https://deno.land/x/hono@v4.0.0/middleware/logger/index.ts";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// In-memory storage for testing
const testStorage = new Map();

// Utility function to hash voter email for privacy
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple email sending function for local testing
async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    const SMTP_HOST = Deno.env.get('SMTP_HOST');
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const SMTP_USER = Deno.env.get('SMTP_USER');
    const SMTP_PASS = Deno.env.get('SMTP_PASS');

    // If SMTP credentials are provided, send real email
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      console.log(`📧 Sending REAL email to ${to} via ${SMTP_HOST}:${SMTP_PORT}`);

      const conn = await Deno.connect({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
      });

      // SMTP conversation for authenticated sending
      const commands = [
        `EHLO localhost\r\n`,
        `AUTH LOGIN\r\n`,
        btoa(SMTP_USER) + '\r\n',
        btoa(SMTP_PASS) + '\r\n',
        `MAIL FROM: <${SMTP_USER}>\r\n`,
        `RCPT TO: <${to}>\r\n`,
        `DATA\r\n`,
        `Subject: ${subject}\r\n`,
        `From: Voting App <${SMTP_USER}>\r\n`,
        `To: ${to}\r\n`,
        `Content-Type: text/html; charset=UTF-8\r\n`,
        `MIME-Version: 1.0\r\n`,
        `\r\n`,
        `${htmlContent}\r\n`,
        `.\r\n`,
        `QUIT\r\n`
      ];

      for (const command of commands) {
        if (typeof command === 'string') {
          await conn.write(new TextEncoder().encode(command));
        }
        // Read response but don't block
        try {
          const buffer = new Uint8Array(1024);
          await conn.read(buffer);
        } catch (e) {
          // Ignore read errors for simple testing
        }
      }

      conn.close();
      console.log(`✅ Email sent successfully to ${to}`);
      return true;
    } else {
      // Fallback to console logging
      console.log(`📧 EMAIL TO: ${to}`);
      console.log(`📧 SUBJECT: ${subject}`);
      console.log(`📧 CONTENT:\n${htmlContent}`);
      console.log(`📧 NOTE: Configure SMTP_HOST, SMTP_USER, SMTP_PASS for real email sending`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
}

// Health check endpoint
app.get("/make-server-02adf113/health", (c) => {
  return c.json({ status: "ok" });
});

// Send registration link via email
app.post("/make-server-02adf113/send-registration-link", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const hashedEmail = await hashEmail(email);

    // Check if already registered
    const existing = testStorage.get(`voter:${hashedEmail}`);
    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Generate a temporary registration token
    const registrationToken = crypto.randomUUID();
    testStorage.set(`registration-token:${registrationToken}`, {
      email,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    });

    // Create registration link
    const origin = c.req.header('origin') || c.req.header('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3001';
    const registrationLink = `${origin}?regToken=${registrationToken}`;

    // Send email with registration link
    const emailSent = await sendEmail(
      email,
      "Complete Your Voter Registration - Class Representative Election",
      `<html><body><h1>Complete Registration</h1><p>Click here: <a href="${registrationLink}">${registrationLink}</a></p></body></html>`
    );

    if (emailSent) {
      console.log(`Registration email sent to ${email}`);
      return c.json({
        success: true,
        message: "Registration link sent to your email",
        testLink: registrationLink
      });
    } else {
      return c.json({
        success: true,
        message: "Registration link generated",
        registrationLink
      });
    }

  } catch (error) {
    console.log(`Send registration link error: ${error}`);
    return c.json({ error: "Failed to send registration link" }, 500);
  }
});

// Verify registration token
app.get("/make-server-02adf113/verify-registration-token/:token", async (c) => {
  try {
    const token = c.req.param('token');
    const tokenData = testStorage.get(`registration-token:${token}`);

    if (!tokenData) {
      return c.json({ error: "Invalid or expired registration token" }, 404);
    }

    if (new Date() > new Date(tokenData.expiresAt)) {
      testStorage.delete(`registration-token:${token}`);
      return c.json({ error: "Registration token has expired" }, 400);
    }

    return c.json({
      success: true,
      email: tokenData.email
    });

  } catch (error) {
    console.log(`Registration token verification error: ${error}`);
    return c.json({ error: "Token verification failed" }, 500);
  }
});

// Complete registration with token
app.post("/make-server-02adf113/complete-registration", async (c) => {
  try {
    const { token, fullName, studentClass } = await c.req.json();

    if (!token || !fullName || !studentClass) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const tokenData = testStorage.get(`registration-token:${token}`);
    if (!tokenData) {
      return c.json({ error: "Invalid or expired registration token" }, 404);
    }

    if (new Date() > new Date(tokenData.expiresAt)) {
      testStorage.delete(`registration-token:${token}`);
      return c.json({ error: "Registration token has expired" }, 400);
    }

    const hashedEmail = await hashEmail(tokenData.email);

    // Check if already registered (double check)
    const existing = testStorage.get(`voter:${hashedEmail}`);
    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Store voter registration
    testStorage.set(`voter:${hashedEmail}`, {
      email: tokenData.email,
      fullName,
      studentClass,
      registeredAt: new Date().toISOString(),
      hasVoted: false
    });

    // Add as candidate
    testStorage.set(`candidate:${hashedEmail}`, {
      name: fullName,
      studentClass,
      registeredAt: new Date().toISOString()
    });

    // Clean up registration token
    testStorage.delete(`registration-token:${token}`);

    console.log(`Completed registration for: ${tokenData.email} in class ${studentClass}`);
    return c.json({ success: true, message: "Registration completed successfully" });

  } catch (error) {
    console.log(`Complete registration error: ${error}`);
    return c.json({ error: "Registration completion failed" }, 500);
  }
});

// Send voting link via email
app.post("/make-server-02adf113/send-vote-link", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const hashedEmail = await hashEmail(email);
    const voter = testStorage.get(`voter:${hashedEmail}`);

    if (!voter) {
      return c.json({ error: "Email not found in voter registry" }, 404);
    }

    if (voter.hasVoted) {
      return c.json({ error: "You have already voted" }, 400);
    }

    // Generate a temporary voting token
    const votingToken = crypto.randomUUID();
    testStorage.set(`voting-token:${votingToken}`, {
      hashedEmail,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    });

    // Create voting link
    const origin = c.req.header('origin') || c.req.header('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3001';
    const votingLink = `${origin}?token=${votingToken}`;

    // Send email with voting link
    const emailSent = await sendEmail(
      email,
      "Your Voting Link - Class Representative Election",
      `<html><body><h1>Your Voting Link</h1><p>Click here: <a href="${votingLink}">${votingLink}</a></p></body></html>`
    );

    if (emailSent) {
      console.log(`Voting email sent to ${email}`);
      return c.json({
        success: true,
        message: "Voting link sent to your email",
        testLink: votingLink
      });
    } else {
      return c.json({
        success: true,
        message: "Voting link generated",
        votingLink
      });
    }

  } catch (error) {
    console.log(`Send vote link error: ${error}`);
    return c.json({ error: "Failed to send voting link" }, 500);
  }
});

// Get candidates for a specific class
app.get("/make-server-02adf113/candidates/:class", async (c) => {
  try {
    const studentClass = c.req.param('class');

    const candidates = [];
    for (const [key, candidate] of testStorage.entries()) {
      if (key.startsWith('candidate:') && candidate.studentClass === studentClass) {
        candidates.push({
          id: candidate.name.toLowerCase().replace(/\s+/g, '-'),
          name: candidate.name
        });
      }
    }

    return c.json({ candidates });

  } catch (error) {
    console.log(`Get candidates error: ${error}`);
    return c.json({ error: "Failed to get candidates" }, 500);
  }
});

console.log('🚀 Test Voting Backend Server Starting...');
console.log('📧 Email functionality enabled (logs to console)');
console.log('💾 Using in-memory storage for testing');

Deno.serve(app.fetch);
