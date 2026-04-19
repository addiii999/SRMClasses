const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

const setStudentAuthCookie = (res, token) => {
  res.cookie('studentToken', token, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const setAdminAuthCookie = (res, token) => {
  res.cookie('adminToken', token, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearStudentAuthCookie = (res) => {
  res.clearCookie('studentToken', baseCookieOptions);
};

const clearAdminAuthCookie = (res) => {
  res.clearCookie('adminToken', baseCookieOptions);
};

module.exports = {
  setStudentAuthCookie,
  setAdminAuthCookie,
  clearStudentAuthCookie,
  clearAdminAuthCookie,
};
