export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {
    const { code } = req.body || {};

    if (!code) {
      return res.status(400).json({
        error: "Missing authorization code"
      });
    }

    const params = new URLSearchParams();

    params.append("client_key", process.env.TIKTOK_CLIENT_KEY);
    params.append("client_secret", process.env.TIKTOK_CLIENT_SECRET);
    params.append("code", code);
    params.append(
      "grant_type",
      "authorization_code"
    );
    params.append(
      "redirect_uri",
      "https://abomiku.vercel.app/tiktok-callback.html"
    );

    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: params
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(400).json({
        error: "TikTok token request failed",
        details: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    const userResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,follower_count",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      return res.status(400).json({
        error: "TikTok user info request failed",
        details: userData
      });
    }

    const user = userData.data?.user;

    return res.status(200).json({
      follower_count: user?.follower_count ?? 0,
      display_name: user?.display_name ?? ""
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
}
