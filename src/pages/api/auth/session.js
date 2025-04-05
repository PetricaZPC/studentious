import clientPromise from "../../mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(401).json({ user: null });
    }

    const client = await clientPromise;
    const db = client.db("accounts");
    const user = await db.collection("users").findOne({ sessionId });

    if (!user) {
      return res.status(401).json({ user: null });
    }

    return res.status(200).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Session check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}