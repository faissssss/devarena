export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}
