import createResponse from '../../shared/utils/createResponse.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import Station from './stations.model.js';


// 1. Lấy danh sách tất cả các trạm
export const getAllStations = handleAsync(async (req, res) => {
  const stations = await Station.find().sort({ createdAt: -1 });
  return createResponse(res, 200, 'Lấy danh sách trạm thành công', stations);
});

