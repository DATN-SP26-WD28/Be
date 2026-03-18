import crypto from 'crypto';
import qs from 'qs';

class PaymentService {
    constructor() {
        // Các thông tin này bạn lấy từ trang Sandbox của VNPay
        this.vnp_TmnCode = "MÃ_TMN_CODE_CỦA_BẠN";
        this.vnp_HashSecret = "MÃ_HASH_SECRET_CỦA_BẠN";
        this.vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        this.vnp_ReturnUrl = "http://localhost:1904/payments/vnpay-callback";
    }

    /**
     * Tạo URL thanh toán sang VNPay
     */
    async generateUrl(invoice_id, amount, ipAddr) {
        let date = new Date();
        let createDate = this.formatDate(date);

        let vnp_Params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': this.vnp_TmnCode,
            'vnp_Locale': 'vn',
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': invoice_id, // Sử dụng ID hóa đơn làm mã tham chiếu
            'vnp_OrderInfo': `Thanh toan hoa don Roosta: ${invoice_id}`,
            'vnp_OrderType': 'other',
            'vnp_Amount': amount * 100, // VNPay tính theo đơn vị xu (VND * 100)
            'vnp_ReturnUrl': this.vnp_ReturnUrl,
            'vnp_IpAddr': ipAddr,
            'vnp_CreateDate': createDate,
        };

        // 1. Sắp xếp các tham số theo thứ tự alphabet (Bắt buộc)
        vnp_Params = this.sortObject(vnp_Params);

        // 2. Tạo chuỗi Query String
        let signData = qs.stringify(vnp_Params, { encode: false });

        // 3. Tạo mã băm SecureHash
        let hmac = crypto.createHmac("sha512", this.vnp_HashSecret);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        vnp_Params['vnp_SecureHash'] = signed;

        // 4. Trả về URL hoàn chỉnh
        return this.vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false });
    }

    /**
     * Hàm helper sắp xếp Object
     */
    sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[decodeURIComponent(str[key])]).replace(/%20/g, "+");
        }
        return sorted;
    }

    /**
     * Định dạng ngày tháng yyyyMMddHHmmss
     */
    formatDate(date) {
        let year = date.getFullYear();
        let month = ("0" + (date.getMonth() + 1)).slice(-2);
        let day = ("0" + date.getDate()).slice(-2);
        let hour = ("0" + date.getHours()).slice(-2);
        let minute = ("0" + date.getMinutes()).slice(-2);
        let second = ("0" + date.getSeconds()).slice(-2);
        return year + month + day + hour + minute + second;
    }
}

export default new PaymentService();