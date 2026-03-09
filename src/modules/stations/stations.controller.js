import createError from '../../shared/utils/createError.js';
import createResponse from '../../shared/utils/createResponse.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import Station from './stations.model.js';


// 1. Lấy danh sách tất cả các trạm
export const getAllStations = handleAsync(async (req, res) => {
  const stations = await Station.find().sort({ createdAt: -1 });
  return createResponse(res, 200, 'Lấy danh sách trạm thành công', stations);
});

// 2. Tạo trạm chế biến mới (Dành cho Admin)
export const createStation = handleAsync(async (req, res) => {
  const { name, printer_ip, description } = req.body;

  const existingStation = await Station.findOne({ name });
  if (existingStation) {
    throw createError(res, 400, 'Tên trạm này đã tồn tại');
  }

  const newStation = await Station.create({ name, printer_ip, description });
  return createResponse(res, 201, 'Thêm trạm mới thành công', newStation);
});

