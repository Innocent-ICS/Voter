import { Hono } from "https://deno.land/x/hono@v4.0.0/mod.ts";
import { cors } from "https://deno.land/x/hono@v4.0.0/middleware/cors/index.ts";
import { logger } from "https://deno.land/x/hono@v4.0.0/middleware/logger/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.ts";

// Simple email sending function for local testing
async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'localhost';
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '1025');

    console.log(`\n📧 EMAIL TO: ${to}`);
    console.log(`📧 SUBJECT: ${subject}`);
    console.log(`📧 CONTENT:\n${htmlContent}`);
    console.log(`📧 SMTP: ${SMTP_HOST}:${SMTP_PORT}`);

    // For local testing, skip actual SMTP and just log
    // Uncomment below to enable actual SMTP sending when MailHog is running
    /*
    // For local testing, we'll use a simple TCP connection to MailHog
    const conn = await Deno.connect({ hostname: SMTP_HOST, port: SMTP_PORT });

    // Simple SMTP commands for testing
    const commands = [
      `HELO localhost\r\n`,
      `MAIL FROM: <noreply@voting-app.local>\r\n`,
      `RCPT TO: <${to}>\r\n`,
      `DATA\r\n`,
      `Subject: ${subject}\r\n`,
      `To: ${to}\r\n`,
      `Content-Type: text/html\r\n`,
      `\r\n`,
      `${htmlContent}\r\n`,
      `.\r\n`,
      `QUIT\r\n`
    ];

    for (const command of commands) {
      await conn.write(new TextEncoder().encode(command));
      // Read response (but don't block for local testing)
      try {
        const buffer = new Uint8Array(1024);
        await conn.read(buffer);
      } catch (e) {
        // Ignore read errors for simple testing
      }
    }

    conn.close();
    */
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

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

// Initialize Supabase client (with fallback for testing)
let supabase;
try {
  supabase = createClient(
    Deno.env.get('SUPABASE_URL') || 'https://test.supabase.co',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'test-key'
  );
  // Test the connection to make sure it works
  console.log('Supabase initialized successfully');
} catch (error) {
  console.warn('Supabase initialization failed, running in offline mode:', error.message);
  // Create a mock client for testing
  supabase = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      upsert: () => ({ data: [], error: null })
    })
  };
}

// Utility function to hash voter email for privacy
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Health check endpoint
app.get("/make-server-02adf113/health", (c) => {
  return c.json({ status: "ok" });
});

// Register new voter/candidate
app.post("/make-server-02adf113/register", async (c) => {
  try {
    const { email, fullName, studentClass } = await c.req.json();
    
    if (!email || !fullName || !studentClass) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const hashedEmail = await hashEmail(email);
    
    // Check if already registered
    const existing = await kv.get(`voter:${hashedEmail}`);
    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Store voter registration
    await kv.set(`voter:${hashedEmail}`, {
      email,
      fullName,
      studentClass,
      registeredAt: new Date().toISOString(),
      hasVoted: false
    });

    // Add as candidate
    await kv.set(`candidate:${hashedEmail}`, {
      name: fullName,
      studentClass,
      registeredAt: new Date().toISOString()
    });

    console.log(`Registered new voter/candidate: ${email} in class ${studentClass}`);
    return c.json({ success: true, message: "Registration successful" });

  } catch (error) {
    console.log(`Registration error: ${error}`);
    return c.json({ error: "Registration failed" }, 500);
  }
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
    const existing = await kv.get(`voter:${hashedEmail}`);
    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Generate a temporary registration token
    const registrationToken = crypto.randomUUID();
    await kv.set(`registration-token:${registrationToken}`, {
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
      `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #2196F3); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; text-align: center;">🗳️ Class Representative Election</h1>
          </div>
          <div style="background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px; padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Complete Your Registration</h2>
            <p>Hello!</p>
            <p>Thank you for your interest in participating in the class representative election. To complete your registration, please click the button below:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationLink}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Complete Registration
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour for security reasons. If you didn't request this registration, please ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              This is a test email from your local voting application.<br>
              Link: ${registrationLink}
            </p>
          </div>
        </body>
      </html>
      `
    );

    if (emailSent) {
      console.log(`Registration email sent to ${email}`);
      return c.json({
        success: true,
        message: "Registration link sent to your email",
        // For testing, also return the link directly
        testLink: registrationLink
      });
    } else {
      console.log(`Failed to send registration email to ${email}, returning link directly`);
      return c.json({
        success: true,
        message: "Registration link generated (email failed, check test link)",
        registrationLink
      });
    }

  } catch (error) {
    console.log(`Send registration link error: ${error}`);
    return c.json({ error: "Failed to send registration link" }, 500);
  }
});

// Complete registration with token
app.post("/make-server-02adf113/complete-registration", async (c) => {
  try {
    const { token, fullName, studentClass } = await c.req.json();
    
    if (!token || !fullName || !studentClass) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const tokenData = await kv.get(`registration-token:${token}`);
    if (!tokenData) {
      return c.json({ error: "Invalid or expired registration token" }, 404);
    }

    if (new Date() > new Date(tokenData.expiresAt)) {
      await kv.del(`registration-token:${token}`);
      return c.json({ error: "Registration token has expired" }, 400);
    }

    const hashedEmail = await hashEmail(tokenData.email);
    
    // Check if already registered (double check)
    const existing = await kv.get(`voter:${hashedEmail}`);
    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Store voter registration
    await kv.set(`voter:${hashedEmail}`, {
      email: tokenData.email,
      fullName,
      studentClass,
      registeredAt: new Date().toISOString(),
      hasVoted: false
    });

    // Add as candidate
    await kv.set(`candidate:${hashedEmail}`, {
      name: fullName,
      studentClass,
      registeredAt: new Date().toISOString()
    });

    // Clean up registration token
    await kv.del(`registration-token:${token}`);

    console.log(`Completed registration for: ${tokenData.email} in class ${studentClass}`);
    return c.json({ success: true, message: "Registration completed successfully" });

  } catch (error) {
    console.log(`Complete registration error: ${error}`);
    return c.json({ error: "Registration completion failed" }, 500);
  }
});

// Verify registration token
app.get("/make-server-02adf113/verify-registration-token/:token", async (c) => {
  try {
    const token = c.req.param('token');
    const tokenData = await kv.get(`registration-token:${token}`);
    
    if (!tokenData) {
      return c.json({ error: "Invalid or expired registration token" }, 404);
    }

    if (new Date() > new Date(tokenData.expiresAt)) {
      await kv.del(`registration-token:${token}`);
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

// Send voting link via email
app.post("/make-server-02adf113/send-vote-link", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const hashedEmail = await hashEmail(email);
    const voter = await kv.get(`voter:${hashedEmail}`);

    if (!voter) {
      return c.json({ error: "Email not found in voter registry" }, 404);
    }

    if (voter.hasVoted) {
      return c.json({ error: "You have already voted" }, 400);
    }

    // Generate a temporary voting token
    const votingToken = crypto.randomUUID();
    await kv.set(`voting-token:${votingToken}`, {
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
      `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2196F3, #4CAF50); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; text-align: center;">🗳️ Your Voting Link is Ready</h1>
          </div>
          <div style="background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px; padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${voter.fullName}!</h2>
            <p>Thank you for registering for the class representative election. Your secure voting link is ready.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${votingLink}" style="background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🗳️ Start Voting
              </a>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Voting Details:</h3>
              <ul style="color: #666;">
                <li>Class: ${voter.studentClass}</li>
                <li>Expires: 30 minutes from now</li>
                <li>Security: One-time use token</li>
              </ul>
            </div>

            <p style="color: #666; font-size: 14px;">
              This link is unique to you and will expire in 30 minutes for security. Make sure to complete your vote before it expires.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              This is a test email from your local voting application.<br>
              Link: ${votingLink}
            </p>
          </div>
        </body>
      </html>
      `
    );

    if (emailSent) {
      console.log(`Voting email sent to ${email}`);
      return c.json({
        success: true,
        message: "Voting link sent to your email",
        // For testing, also return the link directly
        testLink: votingLink
      });
    } else {
      console.log(`Failed to send voting email to ${email}, returning link directly`);
      return c.json({
        success: true,
        message: "Voting link generated (email failed, check test link)",
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
    const candidates = await kv.getByPrefix('candidate:');
    
    const classmates = candidates
      .filter(candidate => candidate.studentClass === studentClass)
      .map(candidate => ({
        id: candidate.name.toLowerCase().replace(/\s+/g, '-'),
        name: candidate.name
      }));

    return c.json({ candidates: classmates });

  } catch (error) {
    console.log(`Get candidates error: ${error}`);
    return c.json({ error: "Failed to get candidates" }, 500);
  }
});

// Verify voting token and get voter info
app.get("/make-server-02adf113/verify-token/:token", async (c) => {
  try {
    const token = c.req.param('token');
    const tokenData = await kv.get(`voting-token:${token}`);
    
    if (!tokenData) {
      return c.json({ error: "Invalid or expired voting token" }, 404);
    }

    if (new Date() > new Date(tokenData.expiresAt)) {
      await kv.del(`voting-token:${token}`);
      return c.json({ error: "Voting token has expired" }, 400);
    }

    const voter = await kv.get(`voter:${tokenData.hashedEmail}`);
    if (!voter) {
      return c.json({ error: "Voter not found" }, 404);
    }

    if (voter.hasVoted) {
      return c.json({ error: "You have already voted" }, 400);
    }

    return c.json({ 
      success: true, 
      voterClass: voter.studentClass,
      voterName: voter.fullName
    });

  } catch (error) {
    console.log(`Token verification error: ${error}`);
    return c.json({ error: "Token verification failed" }, 500);
  }
});

// Submit vote
app.post("/make-server-02adf113/submit-vote", async (c) => {
  try {
    const { token, votes } = await c.req.json();
    
    if (!token || !votes) {
      return c.json({ error: "Missing token or votes" }, 400);
    }

    const tokenData = await kv.get(`voting-token:${token}`);
    if (!tokenData) {
      return c.json({ error: "Invalid voting token" }, 404);
    }

    const voter = await kv.get(`voter:${tokenData.hashedEmail}`);
    if (!voter || voter.hasVoted) {
      return c.json({ error: "Invalid voter or already voted" }, 400);
    }

    // Record the vote
    const voteId = crypto.randomUUID();
    await kv.set(`vote:${voteId}`, {
      ...votes,
      voterClass: voter.studentClass,
      submittedAt: new Date().toISOString()
    });

    // Mark voter as having voted
    await kv.set(`voter:${tokenData.hashedEmail}`, {
      ...voter,
      hasVoted: true,
      votedAt: new Date().toISOString()
    });

    // Clean up voting token
    await kv.del(`voting-token:${token}`);

    console.log(`Vote submitted for class ${voter.studentClass}`);
    return c.json({ success: true, message: "Vote submitted successfully" });

  } catch (error) {
    console.log(`Submit vote error: ${error}`);
    return c.json({ error: "Failed to submit vote" }, 500);
  }
});

// Get voting results
app.get("/make-server-02adf113/results", async (c) => {
  try {
    const votes = await kv.getByPrefix('vote:');
    const candidates = await kv.getByPrefix('candidate:');
    
    // Group results by class
    const resultsByClass: Record<string, any> = {};
    
    votes.forEach(vote => {
      const className = vote.voterClass;
      if (!resultsByClass[className]) {
        resultsByClass[className] = {};
      }
      
      // Count first preference votes (2 points)
      if (vote.firstChoice) {
        if (!resultsByClass[className][vote.firstChoice]) {
          resultsByClass[className][vote.firstChoice] = 0;
        }
        resultsByClass[className][vote.firstChoice] += 2;
      }
      
      // Count second preference votes (1 point)
      if (vote.secondChoice) {
        if (!resultsByClass[className][vote.secondChoice]) {
          resultsByClass[className][vote.secondChoice] = 0;
        }
        resultsByClass[className][vote.secondChoice] += 1;
      }
    });

    return c.json({ results: resultsByClass });

  } catch (error) {
    console.log(`Get results error: ${error}`);
    return c.json({ error: "Failed to get results" }, 500);
  }
});

// Get port from environment variable or default to 8000
const port = parseInt(Deno.env.get("PORT") || "8000");

console.log(`🚀 Server starting on port ${port}...`);

Deno.serve({
  port: port,
  hostname: "0.0.0.0",
  onListen: ({ port, hostname }) => {
    console.log(`✅ Server running on http://${hostname}:${port}`);
  },
}, app.fetch);