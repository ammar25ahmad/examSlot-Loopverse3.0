export function sendSuccess(res, data = null, statusCode = 200, extra = {}) {
  return res.status(statusCode).json({ success: true, data, ...extra });
}

export function sendCreated(res, data = null, extra = {}) {
  return sendSuccess(res, data, 201, extra);
}

export function sendPaginated(res, data, pagination, extra = {}) {
  return res.status(200).json({ success: true, data, pagination, ...extra });
}

export function sendError(res, statusCode, message, code = 'ERROR', details = undefined) {
  return res.status(statusCode).json({
    success: false,
    error: { message, code, ...(details ? { details } : {}) },
  });
}

export default { sendSuccess, sendCreated, sendPaginated, sendError };
