function createResponse(data, message, meta) {
  return {
    message: message || "Successfully!",
    data,
    meta,
  };
}

export default createResponse;
