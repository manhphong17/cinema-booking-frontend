# API Interceptor - Tự động xử lý Authentication

## Cách sử dụng

### 1. Import apiClient

```typescript
import { apiClient } from "@/src/api/interceptor";
```

### 2. Thay thế fetch bằng apiClient

**Trước:**

```typescript
const response = await fetchWithAuth(`${BASE_URL}/movies`, {
  method: "POST",
  body: formData,
});
```

**Sau:**

```typescript
const response = await apiClient.post("/movies", formData);
```

### 3. Các method có sẵn

```typescript
// GET
const response = await apiClient.get("/movies");

// POST
const response = await apiClient.post("/movies", data);

// PUT
const response = await apiClient.put("/movies/123", data);

// DELETE
const response = await apiClient.delete("/movies/123");

// POST với FormData
const response = await apiClient.post("/movies", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});
```

## Tính năng tự động

✅ **Tự động thêm token** vào mọi request
✅ **Tự động refresh token** khi hết hạn
✅ **Tự động redirect** về đúng trang login dựa trên role:

- `/login` - cho customer
- `/login/admin` - cho admin/operator/business-manager
  ✅ **Retry request** với token mới sau khi refresh
  ✅ **Toast notification** khi session hết hạn

## Lưu ý

- Không cần kiểm tra token hết hạn thủ công
- Không cần xử lý redirect về login
- Chỉ cần sử dụng `apiClient` thay vì `fetch`
- Response data sẽ có cấu trúc: `response.data.data`
- **Smart redirect**: Interceptor sẽ tự động redirect đến đúng trang login:
  - Nếu đang ở `/admin/*`, `/operator-manager/*`, `/business-manager/*` → `/login/admin`
  - Các trang khác → `/login`
