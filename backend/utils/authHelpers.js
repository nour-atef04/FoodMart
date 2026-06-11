import jwt from "jsonwebtoken";

export const COOKIE_NAME = "foodmart_auth";
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE,
};

export const signAuthToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  // payload of jwt
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

export const setAuthCookie = (res, user) => {
  const token = signAuthToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions);
};

export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    ...cookieOptions,
    maxAge: undefined,
  });
};
