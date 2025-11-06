# Hướng dẫn tạo mã QR cho đơn hàng

## Các thay đổi đã thực hiện (Cập nhật mới nhất)

### 1. Sửa lỗi hiển thị mã đơn hàng (orderCode)
- **File**: `src/api/orders.ts`
- **Thay đổi**: Thêm `raw?.orderCode` vào hàm `normalizeOrder` để lấy mã đơn từ backend
- **Kết quả**: Mã đơn hàng (`orderCode`) từ API `/orders/{id}` giờ sẽ hiển thị đúng trong bảng danh sách đơn hàng

### 2. Tích hợp API QR Payload từ Backend
- **File**: `src/api/orders.ts`
- **API**: `generateQRCode(orderId: number)` - Gọi `GET /orders/{orderId}/qr-payload`
- **Chức năng**: Lấy thông tin QR payload từ backend (bao gồm JWT, thông tin đơn hàng, thời gian hết hạn)

### 3. Cài đặt thư viện QR Code
- **Package**: `qrcode.react`
- **Chức năng**: Render QR code từ JWT string

### 4. Cập nhật giao diện modal chi tiết đơn hàng
- **File**: `components/customer/order-detail-modal.tsx`
- **Thêm**:
  - Import `QRCodeSVG` từ `qrcode.react`
  - Render QR code từ `qrJwt` (JWT token)
  - Hiển thị thời gian hết hạn QR (`qrExpiryAt`)
  - Hiển thị thời gian gia hạn (`graceMinutes`)
  - Nút "Tạo mã QR" khi QR chưa được tạo
  - Nút "Tạo lại mã QR" khi QR đã hết hạn
  - Hiển thị thông báo lỗi khi tạo QR thất bại
  - Loading state khi đang tạo QR

### 5. Cập nhật TypeScript Types
- **File**: `src/api/orders.ts`
- **Thêm vào `OrderDetail`**:
  - `qrExpiryAt: string | null` - Thời gian hết hạn QR
  - `payloadJson?: string` - JSON payload của QR
  - `nonce?: string` - Mã nonce để bảo mật
  - `version?: number` - Phiên bản QR

## Tại sao không thể tạo mã QR?

Có nhiều lý do khiến việc tạo mã QR thất bại:

### 1. Backend đã có endpoint
- **Endpoint hiện tại**: `GET /orders/{orderId}/qr-payload` ✅
- **Chức năng**: Trả về thông tin QR payload bao gồm JWT, thời gian hết hạn, và metadata

### 2. Đơn hàng không đủ điều kiện
Backend có thể từ chối tạo QR nếu:
- Đơn hàng chưa thanh toán (`orderStatus != "COMPLETED"`)
- Đơn hàng đã bị hủy (`orderStatus == "CANCELLED"`)
- Suất chiếu đã qua (quá thời gian cho phép)
- Đơn hàng không có thông tin suất chiếu (`showtimeStart` null)
- `qrAvailable = false` (đơn hàng không hỗ trợ QR)

### 3. Lỗi xác thực
- **Kiểm tra**: Token xác thực có hợp lệ không?
- **Giải pháp**: Đảm bảo `accessToken` trong localStorage còn hiệu lực

### 4. Giới hạn tạo lại QR
- **Kiểm tra**: `regenerateAllowed = false`
- **Ý nghĩa**: Backend không cho phép tạo lại QR cho đơn hàng này
- **Lý do**: Có thể đã tạo quá nhiều lần hoặc vi phạm quy tắc nghiệp vụ

### 5. Lỗi từ backend
- **Kiểm tra**: Xem console browser hoặc response từ API
- **Thông tin**: Thông báo lỗi sẽ hiển thị trong modal

## Cách kiểm tra và debug

### 1. Kiểm tra API endpoint
```bash
# Test endpoint với curl hoặc Postman
POST http://localhost:8885/orders/6/generate-qr
Headers:
  Authorization: Bearer <your-token>
```

### 2. Kiểm tra response từ GET /orders/{id}
```json
{
  "qrAvailable": true,      // Phải là true
  "qrExpired": false,       // Nếu true, cần regenerateAllowed = true
  "regenerateAllowed": true, // Cho phép tạo lại
  "orderStatus": "COMPLETED" // Trạng thái phù hợp
}
```

### 3. Xem console log
- Mở Developer Tools (F12)
- Tab Console: Xem lỗi JavaScript
- Tab Network: Xem request/response từ API

### 4. Kiểm tra điều kiện nghiệp vụ
- Đơn hàng đã thanh toán chưa?
- Suất chiếu còn trong thời gian cho phép không?
- Backend có rule gì về thời gian tạo QR không?

## Cách sử dụng

1. Vào trang "My Orders"
2. Chọn đơn hàng và click "Xem chi tiết"
3. Cuộn xuống phần "Mã QR"
4. Nếu chưa có QR, click nút "Tạo mã QR"
5. Nếu QR hết hạn và được phép, click "Tạo lại mã QR"
6. QR code sẽ hiển thị sau khi tạo thành công

## Lưu ý
- Mã QR có thời gian hết hạn (`qrExpired`)
- Có thể có thời gian gia hạn (`graceMinutes`)
- Không phải đơn hàng nào cũng có thể tạo QR
- Kiểm tra `qrAvailable` để biết đơn hàng có hỗ trợ QR không
