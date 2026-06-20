import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Beaker,
  ClipboardList,
  Database,
  History,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Pill,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { api, clearStoredAuth, getStoredAuth, saveStoredAuth } from "./api";
import "./styles.css";

const dieuHuongNguoiDung = [
  { id: "user-dashboard", label: "Tổng quan", icon: Activity },
  { id: "drugs", label: "Tra cứu thuốc", icon: Pill },
  { id: "diseases", label: "Tra cứu bệnh", icon: Stethoscope },
  { id: "links", label: "Liên kết đã biết", icon: Link2 },
  { id: "prediction", label: "Dự đoán", icon: Beaker },
  { id: "history", label: "Lịch sử dự đoán", icon: History },
  { id: "feedback", label: "Phản hồi", icon: MessageSquare },
];

const dieuHuongQuanTri = [
  { id: "admin-dashboard", label: "Tổng quan quản trị", icon: LayoutDashboard },
  { id: "admin-catalog", label: "Dữ liệu thuốc/bệnh", icon: Database },
  { id: "admin-links", label: "Liên kết thuốc-bệnh", icon: Link2 },
  { id: "admin-predictions", label: "Theo dõi dự đoán", icon: ClipboardList },
  { id: "admin-lookups", label: "Danh mục hệ thống", icon: Settings },
];

const CANH_BAO_Y_TE =
  "Thông tin chỉ phục vụ học tập, nghiên cứu và tham khảo. Không dùng để tự chẩn đoán, kê đơn hoặc thay thế tư vấn của bác sĩ/dược sĩ.";

function layDanhSach(data) {
  return Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
}

function coGiaTri(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function rutGon(value, max = 150) {
  if (!coGiaTri(value)) return "-";
  const text = String(value).trim();
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function hienDiem(value) {
  if (!coGiaTri(value)) return "-";
  return `${value}%`;
}

function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: "" }));
    loader()
      .then((data) => active && setState({ data, loading: false, error: "" }))
      .catch(
        (error) =>
          active &&
          setState({
            data: null,
            loading: false,
            error: error.message || "Không tải được dữ liệu.",
          }),
      );
    return () => {
      active = false;
    };
  }, deps);

  return state;
}

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [authChecked, setAuthChecked] = useState(false);
  const [khuVuc, setKhuVuc] = useState("user");
  const [manHinh, setManHinh] = useState("user-dashboard");

  const user = auth?.user;
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");

  useEffect(() => {
    async function verifySession() {
      if (!auth?.accessToken) {
        setAuthChecked(true);
        return;
      }

      try {
        const currentUser = await api.me();
        const nextAuth = {
          ...auth,
          user: currentUser,
        };

        saveStoredAuth(nextAuth);
        setAuth(nextAuth);
      } catch {
        clearStoredAuth();
        setAuth(null);
      } finally {
        setAuthChecked(true);
      }
    }

    verifySession();
  }, []);

  if (!authChecked) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Đang kiểm tra phiên đăng nhập...</h2>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <AuthPage
        onAuthenticated={(result) => {
          saveStoredAuth(result);
          setAuth(result);
          setKhuVuc("user");
          setManHinh("user-dashboard");
        }}
      />
    );
  }

  const danhSachDieuHuong =
    khuVuc === "user" ? dieuHuongNguoiDung : dieuHuongQuanTri;

  function doiKhuVuc(khuVucMoi) {
    if (khuVucMoi === "admin" && !isAdmin) {
      alert("Bạn không có quyền truy cập trang quản trị.");
      return;
    }

    setKhuVuc(khuVucMoi);
    setManHinh(khuVucMoi === "user" ? "user-dashboard" : "admin-dashboard");
  }

  function logout() {
    clearStoredAuth();
    setAuth(null);
    setKhuVuc("user");
    setManHinh("user-dashboard");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">DD</span>
          <div>
            <strong>DrugDiseaseML</strong>
            <small>Xin chào, {user?.fullName || user?.email}</small>
          </div>
        </div>

        <div className="account-box">
          <strong>{user?.fullName}</strong>
          <small>{user?.email}</small>
          <small>Role: {roles.join(", ") || "USER"}</small>
          <button className="ghost-button" onClick={logout}>
            Đăng xuất
          </button>
        </div>

        <div className="role-switcher" aria-label="Khu vực làm việc">
          <button
            className={khuVuc === "user" ? "active" : ""}
            onClick={() => doiKhuVuc("user")}
          >
            Người dùng
          </button>

          {isAdmin && (
            <button
              className={khuVuc === "admin" ? "active" : ""}
              onClick={() => doiKhuVuc("admin")}
            >
              Quản trị
            </button>
          )}
        </div>

        <nav>
          {danhSachDieuHuong.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={manHinh === item.id ? "nav-item active" : "nav-item"}
                onClick={() => setManHinh(item.id)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="content">
        {khuVuc === "admin" && !isAdmin && <KhongCoQuyen />}

        {khuVuc === "user" && (
          <>
            {manHinh === "user-dashboard" && (
              <TongQuanNguoiDung onOpen={setManHinh} />
            )}
            {manHinh === "drugs" && <ManHinhThuocMoi />}
            {manHinh === "diseases" && <ManHinhBenhMoi />}
            {manHinh === "links" && <ManHinhLienKetMoi />}
            {manHinh === "prediction" && <ManHinhDuDoanMoi />}
            {manHinh === "history" && <ManHinhLichSuDuDoanMoi />}
            {manHinh === "feedback" && <ManHinhPhanHoiMoi />}
          </>
        )}

        {khuVuc === "admin" && isAdmin && (
          <>
            {manHinh === "admin-dashboard" && (
              <TongQuanQuanTri onOpen={setManHinh} />
            )}
            {manHinh === "admin-catalog" && <ManHinhQuanTriDanhMuc />}
            {manHinh === "admin-links" && <ManHinhQuanTriLienKet />}
            {manHinh === "admin-predictions" && <ManHinhQuanTriDuDoan />}
            {manHinh === "admin-lookups" && <ManHinhQuanTriLookup />}
          </>
        )}
      </main>
    </div>
  );
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    organization: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validate() {
    if (!form.email.trim()) {
      return "Vui lòng nhập email.";
    }

    if (!form.password) {
      return "Vui lòng nhập mật khẩu.";
    }

    if (!isLogin) {
      if (!form.fullName.trim()) {
        return "Vui lòng nhập họ tên.";
      }

      if (form.password.length < 6) {
        return "Mật khẩu phải có ít nhất 6 ký tự.";
      }

      if (form.password !== form.confirmPassword) {
        return "Mật khẩu nhập lại không khớp.";
      }
    }

    return "";
  }

  async function submit(event) {
    event.preventDefault();

    setError("");

    const validationMessage = validate();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await api.login({
            email: form.email,
            password: form.password,
          })
        : await api.register({
            fullName: form.fullName,
            email: form.email,
            phone: form.phone || null,
            organization: form.organization || null,
            password: form.password,
            confirmPassword: form.confirmPassword,
          });

      onAuthenticated(result);
    } catch (err) {
      setError(err.message || "Không thể xác thực tài khoản.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">
          <span className="brand-mark">DD</span>
          <div>
            <h1>DrugDiseaseML</h1>
            <p>
              {isLogin
                ? "Đăng nhập để sử dụng hệ thống dự đoán."
                : "Tạo tài khoản người dùng mới."}
            </p>
          </div>
        </div>

        {!isLogin && (
          <>
            <label>
              Họ tên
              <input
                value={form.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </label>

            <label>
              Số điện thoại
              <input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="0900000000"
              />
            </label>

            <label>
              Tổ chức
              <input
                value={form.organization}
                onChange={(event) => update("organization", event.target.value)}
                placeholder="Trường / bệnh viện / nhóm nghiên cứu"
              />
            </label>
          </>
        )}

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="user@example.com"
          />
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder="Ít nhất 6 ký tự"
          />
        </label>

        {!isLogin && (
          <label>
            Nhập lại mật khẩu
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                update("confirmPassword", event.target.value)
              }
              placeholder="Nhập lại mật khẩu"
            />
          </label>
        )}

        {error && <p className="error">{error}</p>}

        <button className="primary" disabled={loading}>
          {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
        </button>

        <button
          type="button"
          className="link-button"
          onClick={() => {
            setError("");
            setMode(isLogin ? "register" : "login");
          }}
        >
          {isLogin
            ? "Chưa có tài khoản? Đăng ký"
            : "Đã có tài khoản? Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

function KhongCoQuyen() {
  return (
    <section className="page">
      <div className="panel state error">
        Bạn không có quyền truy cập trang quản trị.
      </div>
    </section>
  );
}

function TongQuanNguoiDung({ onOpen }) {
  const lookups = useLoad(() => api.getLookups(), []);
  const lichSu = useLoad(() => api.getPredictionHistory(), []);

  const cards = [
    {
      label: "Loại dự đoán",
      value: lookups.data?.predictionTypes?.length ?? "-",
      hint: "Từ /api/lookups",
    },
    {
      label: "Mức tin cậy",
      value: lookups.data?.confidenceLevels?.length ?? "-",
      hint: "Bảng ConfidenceLevels",
    },
    {
      label: "Loại liên kết",
      value: lookups.data?.linkTypes?.length ?? "-",
      hint: "Bảng LinkTypes",
    },
    {
      label: "Lịch sử dự đoán",
      value: lichSu.data?.length ?? "-",
      hint: "Từ /api/du-doan/lich-su",
    },
  ];

  return (
    <section className="page">
      <TieuDeTrang
        eyebrow="Khu vực người dùng"
        title="Dự đoán liên kết thuốc - bệnh"
        subtitle="Tra cứu dữ liệu, gửi yêu cầu dự đoán và phản hồi kết quả dựa trên backend hiện có."
      />
      <LuoiChiSo cards={cards} />
      <div className="action-grid">
        <button className="feature-button" onClick={() => onOpen("drugs")}>
          <Pill size={20} />
          Tra cứu thuốc
        </button>
        <button className="feature-button" onClick={() => onOpen("diseases")}>
          <Stethoscope size={20} />
          Tra cứu bệnh
        </button>
        <button className="feature-button" onClick={() => onOpen("prediction")}>
          <Beaker size={20} />
          Tạo yêu cầu dự đoán
        </button>
      </div>
    </section>
  );
}

function TongQuanQuanTri({ onOpen }) {
  const thuoc = useLoad(() => api.getDrugs({ take: 100 }), []);
  const benh = useLoad(() => api.getDiseases({ take: 100 }), []);
  const lienKet = useLoad(() => api.getLinks({}), []);
  const lichSu = useLoad(() => api.getPredictionHistory(), []);
  const lookups = useLoad(() => api.getLookups(), []);

  const cards = [
    {
      label: "Thuốc đang hiển thị",
      value: thuoc.data?.length ?? "-",
      hint: "Backend cho lấy tối đa 100/lần",
    },
    {
      label: "Bệnh đang hiển thị",
      value: benh.data?.length ?? "-",
      hint: "Backend cho lấy tối đa 100/lần",
    },
    {
      label: "Liên kết đang hiển thị",
      value: lienKet.data?.length ?? "-",
      hint: "Backend giới hạn 100 dòng",
    },
    {
      label: "Yêu cầu dự đoán",
      value: lichSu.data?.length ?? "-",
      hint: "Từ /api/du-doan/lich-su",
    },
  ];

  return (
    <section className="page">
      <TieuDeTrang
        eyebrow="Khu vực quản trị"
        title="Giám sát vận hành backend"
        subtitle="Các màn hình quản trị hiện là chế độ đọc/giám sát theo những API đã có."
      />
      <LuoiChiSo cards={cards} />
      <GhiChuQuanTri>
        API hiện tại hỗ trợ đọc/tìm kiếm dữ liệu và tạo prediction/feedback. Các
        chức năng thêm, sửa, xóa, duyệt, triển khai model và audit log cần bổ
        sung endpoint backend trước khi giao diện có thể ghi dữ liệu.
      </GhiChuQuanTri>
      <div className="action-grid">
        <button
          className="feature-button"
          onClick={() => onOpen("admin-catalog")}
        >
          <Database size={20} />
          Giám sát thuốc/bệnh
        </button>
        <button
          className="feature-button"
          onClick={() => onOpen("admin-links")}
        >
          <Link2 size={20} />
          Xem liên kết
        </button>
        <button
          className="feature-button"
          onClick={() => onOpen("admin-predictions")}
        >
          <ClipboardList size={20} />
          Theo dõi dự đoán
        </button>
      </div>
      <TomTatLookup lookups={lookups} />
    </section>
  );
}

function ManHinhThuoc({
  title = "Tra cứu thuốc",
  subtitle = "Hiển thị tối đa 100 dòng/lần do backend đang giới hạn take.",
}) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [truyVan, setTruyVan] = useState("");
  const [soDong, setSoDong] = useState(100);
  const { data, loading, error } = useLoad(
    () => api.getDrugs({ keyword: truyVan, take: soDong }),
    [truyVan, soDong],
  );

  return (
    <section className="page">
      <TieuDeTrang title={title} subtitle={subtitle} />
      <ThanhTimKiem
        value={tuKhoa}
        onChange={setTuKhoa}
        onSearch={() => setTruyVan(tuKhoa)}
        soDong={soDong}
        onLimitChange={setSoDong}
      />
      <ThongTinGioiHan hienThi={data?.length} tong="597" loai="thuốc" />
      <TrangThaiDuLieu loading={loading} error={error}>
        <table>
          <thead>
            <tr>
              <th>DrugId</th>
              <th>Mã thuốc</th>
              <th>Hoạt chất</th>
              <th>Tên thương mại</th>
              <th>Chỉ định đã biết</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((drug) => (
              <tr key={drug.drugId}>
                <td>{drug.drugId}</td>
                <td>{drug.drugCode}</td>
                <td>{drug.activeName}</td>
                <td>{drug.tradeName || "-"}</td>
                <td className="muted">{drug.knownIndications || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TrangThaiDuLieu>
    </section>
  );
}

function ManHinhBenh({
  title = "Tra cứu bệnh",
  subtitle = "Hiển thị tối đa 100 dòng/lần do backend đang giới hạn take.",
}) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [truyVan, setTruyVan] = useState("");
  const [soDong, setSoDong] = useState(100);
  const { data, loading, error } = useLoad(
    () => api.getDiseases({ keyword: truyVan, take: soDong }),
    [truyVan, soDong],
  );

  return (
    <section className="page">
      <TieuDeTrang title={title} subtitle={subtitle} />
      <ThanhTimKiem
        value={tuKhoa}
        onChange={setTuKhoa}
        onSearch={() => setTruyVan(tuKhoa)}
        soDong={soDong}
        onLimitChange={setSoDong}
      />
      <ThongTinGioiHan hienThi={data?.length} tong="71" loai="bệnh" />
      <TrangThaiDuLieu loading={loading} error={error}>
        <table>
          <thead>
            <tr>
              <th>DiseaseId</th>
              <th>Mã bệnh</th>
              <th>Tên bệnh</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((disease) => (
              <tr key={disease.diseaseId}>
                <td>{disease.diseaseId}</td>
                <td>{disease.diseaseCode}</td>
                <td>{disease.diseaseName}</td>
                <td className="muted">{disease.description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TrangThaiDuLieu>
    </section>
  );
}

function ManHinhLienKet({
  title = "Liên kết thuốc - bệnh đã biết",
  subtitle = "Backend hiện trả tối đa 100 liên kết/lần. Hãy lọc bằng DrugId hoặc DiseaseId để xem đúng nhóm cần tìm.",
}) {
  const [drugId, setDrugId] = useState("");
  const [diseaseId, setDiseaseId] = useState("");
  const [params, setParams] = useState({});
  const { data, loading, error } = useLoad(
    () => api.getLinks(params),
    [JSON.stringify(params)],
  );

  return (
    <section className="page">
      <TieuDeTrang title={title} subtitle={subtitle} />
      <div className="filters">
        <label>
          DrugId
          <input
            value={drugId}
            onChange={(event) => setDrugId(event.target.value)}
          />
        </label>
        <label>
          DiseaseId
          <input
            value={diseaseId}
            onChange={(event) => setDiseaseId(event.target.value)}
          />
        </label>
        <button
          className="primary"
          onClick={() =>
            setParams({
              drugId: drugId ? Number(drugId) : undefined,
              diseaseId: diseaseId ? Number(diseaseId) : undefined,
            })
          }
        >
          <Search size={16} />
          Lọc
        </button>
      </div>
      <ThongTinGioiHan hienThi={data?.length} tong="4,600" loai="liên kết" />
      <TrangThaiDuLieu loading={loading} error={error}>
        <table>
          <thead>
            <tr>
              <th>DrugId</th>
              <th>Thuốc</th>
              <th>DiseaseId</th>
              <th>Bệnh</th>
              <th>Điểm</th>
              <th>Mức tin cậy</th>
              <th>Bằng chứng</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((link) => (
              <tr key={link.linkId}>
                <td>{link.drugId}</td>
                <td>{link.drugName}</td>
                <td>{link.diseaseId}</td>
                <td>{link.diseaseName}</td>
                <td>{formatScore(link.sourceScore)}</td>
                <td>{link.confidenceLevel || "-"}</td>
                <td className="muted">{link.evidenceDescription || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TrangThaiDuLieu>
    </section>
  );
}

function ManHinhThuocMoi({
  title = "Tra cứu thuốc",
  subtitle = "GET /api/thuoc, dữ liệu từ bảng dbo.Thuoc trong DataThuoc.",
}) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [truyVan, setTruyVan] = useState("");
  const [soDong, setSoDong] = useState(12);
  const [thuocDangChon, setThuocDangChon] = useState(null);
  const { data, loading, error } = useLoad(
    () => api.getDrugs({ tuKhoa: truyVan, page: 1, pageSize: soDong }),
    [truyVan, soDong],
  );
  const chiTiet = useLoad(
    () => (thuocDangChon ? api.getDrug(thuocDangChon) : Promise.resolve(null)),
    [thuocDangChon],
  );

  const danhSach = layDanhSach(data);

  return (
    <section className="page">
      <TieuDeTrang title={title} subtitle={subtitle} />
      <CanhBaoYTe />
      <ThanhTimKiem
        value={tuKhoa}
        onChange={setTuKhoa}
        onSearch={() => setTruyVan(tuKhoa)}
        soDong={soDong}
        onLimitChange={setSoDong}
      />
      <ThongTinGioiHan hienThi={danhSach.length} tong={data?.total} loai="thuốc" />
      <TrangThaiDuLieu loading={loading} error={error} variant="plain">
        {danhSach.length === 0 ? (
          <EmptyState title="Chưa có thuốc phù hợp" text="Thử đổi từ khóa hoặc tăng số dòng hiển thị." />
        ) : (
          <div className="drug-grid">
            {danhSach.map((thuoc) => (
              <article className="drug-card" key={thuoc.thuocId}>
                <AnhThuoc src={thuoc.duongDanAnh} alt={thuoc.tenThuoc} />
                <div className="drug-card-body">
                  <div>
                    <small>{thuoc.maThuoc || "Chưa có mã thuốc"}</small>
                    <h3>{thuoc.tenThuoc}</h3>
                  </div>
                  {coGiaTri(thuoc.hoatChat) && <p><strong>Hoạt chất:</strong> {thuoc.hoatChat}</p>}
                  <p className="muted">{rutGon(thuoc.congDung, 135)}</p>
                  <p className="muted"><strong>Tác dụng phụ:</strong> {rutGon(thuoc.tacDungPhu, 110)}</p>
                  {coGiaTri(thuoc.nhaSanXuat) && <p><strong>Nhà sản xuất:</strong> {thuoc.nhaSanXuat}</p>}
                  <div className="badge-row">
                    <span className="review-badge good">Tốt {hienDiem(thuoc.tyLeDanhGiaTot)}</span>
                    <span className="review-badge mid">TB {hienDiem(thuoc.tyLeDanhGiaTrungBinh)}</span>
                    <span className="review-badge low">Kém {hienDiem(thuoc.tyLeDanhGiaKem)}</span>
                  </div>
                  <button type="button" className="ghost-button" onClick={() => setThuocDangChon(thuoc.thuocId)}>
                    Xem chi tiết
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </TrangThaiDuLieu>

      {thuocDangChon && (
        <ChiTietThuoc
          data={chiTiet.data}
          loading={chiTiet.loading}
          error={chiTiet.error}
          onClose={() => setThuocDangChon(null)}
        />
      )}
    </section>
  );
}

function ChiTietThuoc({ data, loading, error, onClose }) {
  if (loading) return <div className="panel state">Đang tải chi tiết thuốc...</div>;
  if (error) return <div className="panel state error">{error}</div>;
  if (!data) return null;

  const benhLienQuan = data.benhLienQuan ?? [];

  return (
    <section className="panel detail-panel">
      <div className="detail-header">
        <AnhThuoc src={data.duongDanAnh} alt={data.tenThuoc} large />
        <div>
          <small>{data.maThuoc}</small>
          <h2>{data.tenThuoc}</h2>
          {coGiaTri(data.tenNhomThuoc) && <span className="status">{data.tenNhomThuoc}</span>}
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Đóng chi tiết
        </button>
      </div>

      <div className="detail-grid">
        <DongThongTin label="Hoạt chất" value={data.hoatChat} />
        <DongThongTin label="Dạng bào chế" value={data.dangBaoChe} />
        <DongThongTin label="Nhà sản xuất" value={data.nhaSanXuat} />
        <DongThongTin label="Trạng thái phê duyệt" value={data.trangThaiPheDuyet} />
        <DongThongTin label="Nguồn dữ liệu" value={data.tenNguonDuLieu} />
        <DongThongTin label="Trạng thái kiểm duyệt" value={data.tenTrangThaiKiemDuyet} />
        <DongThongTin label="Công dụng" value={data.congDung} wide />
        <DongThongTin label="Tác dụng phụ" value={data.tacDungPhu} wide />
        <DongThongTin label="Cơ chế tác động" value={data.coCheTacDong} wide />
        <DongThongTin label="Target gene" value={data.targetGene} wide />
      </div>

      <h3>Bệnh liên quan</h3>
      {benhLienQuan.length === 0 ? (
        <p className="muted">Chưa có liên kết bệnh trong dữ liệu hiện tại.</p>
      ) : (
        <div className="table-wrap nested-table">
          <table>
            <thead>
              <tr>
                <th>Bệnh</th>
                <th>Loại liên kết</th>
                <th>Mức tin cậy</th>
                <th>Điểm</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {benhLienQuan.map((item) => (
                <tr key={item.lienKetId}>
                  <td>{item.tenBenh}</td>
                  <td>{item.tenLoaiLienKet || "-"}</td>
                  <td>{item.tenMucTinCay || "-"}</td>
                  <td>{formatScore(item.diemLienKet)}</td>
                  <td className="muted">{item.ghiChu || item.nguonBangChung || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DongThongTin({ label, value, wide = false }) {
  if (!coGiaTri(value)) return null;
  return (
    <div className={wide ? "info-row wide" : "info-row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ManHinhBenhMoi({
  title = "Tra cứu bệnh",
  subtitle = "GET /api/benh, dữ liệu từ bảng dbo.Benh trong DataThuoc.",
}) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [truyVan, setTruyVan] = useState("");
  const [soDong, setSoDong] = useState(12);
  const { data, loading, error } = useLoad(
    () => api.getDiseases({ tuKhoa: truyVan, page: 1, pageSize: soDong }),
    [truyVan, soDong],
  );
  const danhSach = layDanhSach(data);

  return (
    <section className="page">
      <TieuDeTrang title={title} subtitle={subtitle} />
      <CanhBaoYTe />
      <ThanhTimKiem
        value={tuKhoa}
        onChange={setTuKhoa}
        onSearch={() => setTruyVan(tuKhoa)}
        soDong={soDong}
        onLimitChange={setSoDong}
      />
      <ThongTinGioiHan hienThi={danhSach.length} tong={data?.total} loai="bệnh" />
      <TrangThaiDuLieu loading={loading} error={error}>
        {danhSach.length === 0 ? (
          <EmptyState title="Chưa có bệnh phù hợp" text="Thử đổi từ khóa tìm kiếm." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã bệnh</th>
                <th>Tên bệnh</th>
                <th>Nhóm bệnh</th>
                <th>Mô tả</th>
                <th>Triệu chứng</th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((benh) => (
                <tr key={benh.benhId}>
                  <td>{benh.maBenh}</td>
                  <td>{benh.tenBenh}</td>
                  <td>{benh.tenNhomBenh || "-"}</td>
                  <td className="muted">{rutGon(benh.moTa, 180)}</td>
                  <td className="muted">{rutGon(benh.trieuChung, 160)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TrangThaiDuLieu>
    </section>
  );
}

function ManHinhLienKetMoi({
  title = "Liên kết thuốc - bệnh đã biết",
  subtitle = "GET /api/lien-ket-thuoc-benh, hiển thị các liên kết đã có trong DataThuoc.",
}) {
  const { data, loading, error } = useLoad(() => api.getLinks({}), []);

  return (
    <section className="page">
      <TieuDeTrang title={title} subtitle={subtitle} />
      <CanhBaoYTe />
      <ThongTinGioiHan hienThi={data?.length} tong={data?.length} loai="liên kết" />
      <TrangThaiDuLieu loading={loading} error={error}>
        {(data ?? []).length === 0 ? (
          <EmptyState title="Chưa có liên kết" text="Dữ liệu LienKetThuocBenh chưa trả về bản ghi phù hợp." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Thuốc</th>
                <th>Bệnh</th>
                <th>Loại liên kết</th>
                <th>Mức tin cậy</th>
                <th>Điểm</th>
                <th>Bằng chứng / ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((link) => (
                <tr key={link.lienKetId}>
                  <td>{link.tenThuoc}</td>
                  <td>{link.tenBenh}</td>
                  <td>{link.tenLoaiLienKet || "-"}</td>
                  <td>{link.tenMucTinCay || "-"}</td>
                  <td>{formatScore(link.diemLienKet)}</td>
                  <td className="muted">{link.ghiChu || link.nguonBangChung || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TrangThaiDuLieu>
    </section>
  );
}

function AnhThuoc({ src, alt, large = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!coGiaTri(src) || failed) {
    return (
      <div className={large ? "drug-image placeholder large" : "drug-image placeholder"}>
        <Pill size={large ? 40 : 28} />
        <span>Chưa có ảnh</span>
      </div>
    );
  }

  return (
    <img
      className={large ? "drug-image large" : "drug-image"}
      src={src}
      alt={alt || "Ảnh thuốc"}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function CanhBaoYTe() {
  return (
    <div className="medical-warning">
      <ShieldCheck size={18} />
      <span>{CANH_BAO_Y_TE}</span>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="panel state empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function ManHinhQuanTriDanhMuc() {
  const [tab, setTab] = useState("drugs");
  return (
    <section className="page">
      <TieuDeTrang
        eyebrow="Quản trị"
        title="Giám sát dữ liệu thuốc và bệnh"
        subtitle="Backend hiện hỗ trợ đọc/tìm kiếm Thuoc và Benh trong DataThuoc."
      />
      <div className="tabs">
        <button
          className={tab === "drugs" ? "active" : ""}
          onClick={() => setTab("drugs")}
        >
          Thuốc
        </button>
        <button
          className={tab === "diseases" ? "active" : ""}
          onClick={() => setTab("diseases")}
        >
          Bệnh
        </button>
      </div>
      <GhiChuQuanTri>
        Màn hình thêm/sửa/xóa cần API ghi dữ liệu như POST, PUT, PATCH hoặc
        DELETE ở backend.
      </GhiChuQuanTri>
      {tab === "drugs" ? (
        <ManHinhThuocMoi
          title="Danh mục thuốc"
          subtitle="Chế độ đọc: GET /api/thuoc"
        />
      ) : (
        <ManHinhBenhMoi
          title="Danh mục bệnh"
          subtitle="Chế độ đọc: GET /api/benh"
        />
      )}
    </section>
  );
}

function ManHinhQuanTriLienKet() {
  const lookups = useLoad(() => api.getLookups(), []);
  const [reloadKey, setReloadKey] = useState(0);

  const [filter, setFilter] = useState({
    drugId: "",
    diseaseId: "",
  });

  const [params, setParams] = useState({});

  const links = useLoad(
    () => api.getAdminLinks(params),
    [JSON.stringify(params), reloadKey],
  );

  const emptyForm = {
    linkId: null,
    drugId: "",
    diseaseId: "",
    linkTypeId: "",
    evidenceStatusId: "",
    confidenceLevelId: "",
    sourceScore: "",
    formationBasis: "",
    evidenceDescription: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const linkTypes = lookups.data?.linkTypes ?? [];
  const confidenceLevels = lookups.data?.confidenceLevels ?? [];
  const evidenceStatuses = lookups.data?.evidenceStatuses ?? [];

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setError("");
    setMessage("");
  }

  function validatePositiveInt(value, label) {
    const raw = String(value ?? "").trim();

    if (!raw) {
      return `Vui lòng nhập ${label}.`;
    }

    if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
      return `${label} phải là số nguyên dương.`;
    }

    return "";
  }

  function validateForm() {
    const drugError = validatePositiveInt(form.drugId, "DrugId");
    if (drugError) return drugError;

    const diseaseError = validatePositiveInt(form.diseaseId, "DiseaseId");
    if (diseaseError) return diseaseError;

    const linkTypeError = validatePositiveInt(form.linkTypeId, "LinkTypeId");
    if (linkTypeError) return "Vui lòng chọn loại liên kết.";

    const evidenceError = validatePositiveInt(
      form.evidenceStatusId,
      "EvidenceStatusId",
    );
    if (evidenceError) return "Vui lòng chọn trạng thái bằng chứng.";

    if (form.sourceScore !== "") {
      const score = Number(form.sourceScore);

      if (Number.isNaN(score) || score < 0 || score > 1) {
        return "SourceScore phải nằm trong khoảng 0 đến 1.";
      }
    }

    return "";
  }

  function buildPayload() {
    return {
      drugId: Number(form.drugId),
      diseaseId: Number(form.diseaseId),
      linkTypeId: Number(form.linkTypeId),
      evidenceStatusId: Number(form.evidenceStatusId),
      confidenceLevelId: form.confidenceLevelId
        ? Number(form.confidenceLevelId)
        : null,
      sourceScore: form.sourceScore === "" ? null : Number(form.sourceScore),
      formationBasis: form.formationBasis || null,
      evidenceDescription: form.evidenceDescription || null,
    };
  }

  async function submit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      const payload = buildPayload();

      if (form.linkId) {
        const updated = await api.updateAdminLink(form.linkId, payload);
        setMessage(`Đã cập nhật liên kết ${updated.linkCode}.`);
      } else {
        const created = await api.createAdminLink(payload);
        setMessage(`Đã thêm liên kết ${created.linkCode}.`);
      }

      setForm(emptyForm);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err.message || "Không lưu được liên kết.");
    }
  }

  function editLink(link) {
    setForm({
      linkId: link.linkId,
      drugId: String(link.drugId),
      diseaseId: String(link.diseaseId),
      linkTypeId: String(link.linkTypeId),
      evidenceStatusId: String(link.evidenceStatusId),
      confidenceLevelId: link.confidenceLevelId
        ? String(link.confidenceLevelId)
        : "",
      sourceScore:
        link.sourceScore === null || link.sourceScore === undefined
          ? ""
          : String(link.sourceScore),
      formationBasis: link.formationBasis || "",
      evidenceDescription: link.evidenceDescription || "",
    });

    setError("");
    setMessage("");
  }

  async function deleteLink(link) {
    const ok = window.confirm(
      `Xóa liên kết ${link.linkCode}? Dữ liệu sẽ được xóa mềm.`,
    );

    if (!ok) return;

    setError("");
    setMessage("");

    try {
      await api.deleteAdminLink(link.linkId);
      setMessage(`Đã xóa liên kết ${link.linkCode}.`);
      setReloadKey((value) => value + 1);

      if (form.linkId === link.linkId) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Không xóa được liên kết.");
    }
  }

  return (
    <section className="page">
      <TieuDeTrang
        eyebrow="Quản trị"
        title="Quản lý liên kết thuốc - bệnh"
        subtitle="Admin có thể thêm, sửa và xóa mềm DrugDiseaseLinks."
      />

      <div className="panel">
        <h3>{form.linkId ? "Sửa liên kết" : "Thêm liên kết mới"}</h3>

        <form className="form-grid" onSubmit={submit}>
          <label>
            DrugId
            <input
              type="number"
              min="1"
              value={form.drugId}
              onChange={(event) => update("drugId", event.target.value)}
            />
          </label>

          <label>
            DiseaseId
            <input
              type="number"
              min="1"
              value={form.diseaseId}
              onChange={(event) => update("diseaseId", event.target.value)}
            />
          </label>

          <label>
            Loại liên kết
            <select
              value={form.linkTypeId}
              onChange={(event) => update("linkTypeId", event.target.value)}
            >
              <option value="">Chọn loại liên kết</option>
              {linkTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Trạng thái bằng chứng
            <select
              value={form.evidenceStatusId}
              onChange={(event) =>
                update("evidenceStatusId", event.target.value)
              }
            >
              <option value="">Chọn trạng thái bằng chứng</option>
              {evidenceStatuses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Mức tin cậy
            <select
              value={form.confidenceLevelId}
              onChange={(event) =>
                update("confidenceLevelId", event.target.value)
              }
            >
              <option value="">Không chọn</option>
              {confidenceLevels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            SourceScore
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={form.sourceScore}
              onChange={(event) => update("sourceScore", event.target.value)}
            />
          </label>

          <label className="wide">
            Cơ sở hình thành
            <input
              value={form.formationBasis}
              onChange={(event) =>
                update("formationBasis", event.target.value)
              }
            />
          </label>

          <label className="wide">
            Mô tả bằng chứng
            <textarea
              value={form.evidenceDescription}
              onChange={(event) =>
                update("evidenceDescription", event.target.value)
              }
            />
          </label>

          {error && <p className="error wide">{error}</p>}
          {message && <p className="success wide">{message}</p>}

          <div className="wide table-actions">
            <button className="primary">
              {form.linkId ? "Cập nhật liên kết" : "Thêm liên kết"}
            </button>

            {form.linkId && (
              <button type="button" className="ghost-button" onClick={resetForm}>
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="filters">
        <label>
          Lọc DrugId
          <input
            type="number"
            value={filter.drugId}
            onChange={(event) =>
              setFilter((current) => ({
                ...current,
                drugId: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Lọc DiseaseId
          <input
            type="number"
            value={filter.diseaseId}
            onChange={(event) =>
              setFilter((current) => ({
                ...current,
                diseaseId: event.target.value,
              }))
            }
          />
        </label>

        <button
          className="primary"
          onClick={() =>
            setParams({
              drugId: filter.drugId ? Number(filter.drugId) : undefined,
              diseaseId: filter.diseaseId
                ? Number(filter.diseaseId)
                : undefined,
            })
          }
        >
          <Search size={16} />
          Lọc liên kết
        </button>
      </div>

      <TrangThaiDuLieu loading={links.loading} error={links.error}>
        <table>
          <thead>
            <tr>
              <th>LinkId</th>
              <th>Mã</th>
              <th>Thuốc</th>
              <th>Bệnh</th>
              <th>Loại</th>
              <th>Bằng chứng</th>
              <th>Điểm</th>
              <th>Tin cậy</th>
              <th>Mô tả</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {(links.data ?? []).map((link) => (
              <tr key={link.linkId}>
                <td>{link.linkId}</td>
                <td>{link.linkCode}</td>
                <td>
                  {link.drugName} #{link.drugId}
                </td>
                <td>
                  {link.diseaseName} #{link.diseaseId}
                </td>
                <td>{link.linkType || "-"}</td>
                <td>{link.evidenceStatus || "-"}</td>
                <td>{formatScore(link.sourceScore)}</td>
                <td>{link.confidenceLevel || "-"}</td>
                <td className="muted">{link.evidenceDescription || "-"}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => editLink(link)}
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deleteLink(link)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TrangThaiDuLieu>
    </section>
  );
}

function ManHinhQuanTriDuDoan() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [params, setParams] = useState({});

  const { data, loading, error } = useLoad(
    () => api.getAdminPredictionHistory(params),
    [JSON.stringify(params)],
  );

  return (
    <section className="page">
      <TieuDeTrang
        eyebrow="Quản trị"
        title="Tất cả yêu cầu dự đoán"
        subtitle="Admin xem được request của mọi user trong hệ thống."
      />

      <div className="filters">
        <label>
          UserId
          <input
            type="number"
            value={userId}
            placeholder="Bỏ trống để xem tất cả"
            onChange={(event) => setUserId(event.target.value)}
          />
        </label>

        <label>
          Trạng thái
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tất cả</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>

        <button
          className="primary"
          onClick={() =>
            setParams({
              userId: userId ? Number(userId) : undefined,
              status: status || undefined,
            })
          }
        >
          <Search size={16} />
          Lọc
        </button>
      </div>

      <TrangThaiDuLieu loading={loading} error={error}>
        <table>
          <thead>
            <tr>
              <th>RequestId</th>
              <th>Mã request</th>
              <th>User</th>
              <th>Email</th>
              <th>Loại dự đoán</th>
              <th>Input thuốc</th>
              <th>Input bệnh</th>
              <th>Trạng thái</th>
              <th>Kết quả</th>
              <th>Run mới nhất</th>
              <th>Kết luận</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>

          <tbody>
            {(data ?? []).map((item) => (
              <tr key={item.requestId}>
                <td>{item.requestId}</td>
                <td>{item.requestCode}</td>
                <td>
                  {item.requesterName || "Không rõ"}
                  {item.requesterId ? ` (#${item.requesterId})` : ""}
                </td>
                <td>{item.requesterEmail || item.contactEmail || "-"}</td>
                <td>{item.predictionType}</td>
                <td>
                  {item.inputDrugName || "-"}
                  {item.inputDrugId ? ` (#${item.inputDrugId})` : ""}
                </td>
                <td>
                  {item.inputDiseaseName || "-"}
                  {item.inputDiseaseId ? ` (#${item.inputDiseaseId})` : ""}
                </td>
                <td>
                  <span className="status">{item.requestStatus}</span>
                </td>
                <td>{item.resultCount}</td>
                <td>
                  {item.latestRunCode || "-"}
                  {item.latestRunStatus ? ` (${item.latestRunStatus})` : ""}
                </td>
                <td className="muted">{item.processingConclusion || "-"}</td>
                <td>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TrangThaiDuLieu>
    </section>
  );
}

function ManHinhQuanTriLookup() {
  return (
    <section className="page">
      <TieuDeTrang
        eyebrow="Quản trị"
        title="Danh mục hệ thống"
        subtitle="Backend hiện cung cấp PredictionTypes, ConfidenceLevels và LinkTypes."
      />
      <GhiChuQuanTri>
        Chỉnh sửa lookup cần API ghi dữ liệu. Màn hình này dùng để kiểm tra giá
        trị đang được backend dùng.
      </GhiChuQuanTri>
      <ManHinhLookup />
    </section>
  );
}

function ManHinhDuDoanMoi() {
  const lookups = useLoad(() => api.getLookups(), []);
  const thuoc = useLoad(() => api.getDrugs({ page: 1, pageSize: 100 }), []);
  const benh = useLoad(() => api.getDiseases({ page: 1, pageSize: 100 }), []);
  const [request, setRequest] = useState({
    kieuDuDoan: "DRUG_TO_DISEASE",
    thuocId: "",
    benhId: "",
    soLuongKetQua: 10,
    nguongDiem: 0.5,
    mucDich: "Nghiên cứu liên kết thuốc - bệnh",
    emailLienHe: "",
    daChapNhanCanhBaoYTe: false,
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const predictionTypes = lookups.data?.predictionTypes ?? [
    { code: "DRUG_TO_DISEASE", name: "Từ thuốc tìm bệnh" },
    { code: "DISEASE_TO_DRUG", name: "Từ bệnh tìm thuốc" },
    { code: "PAIR_PREDICTION", name: "Kiểm tra một cặp thuốc - bệnh" },
  ];
  const danhSachThuoc = layDanhSach(thuoc.data);
  const danhSachBenh = layDanhSach(benh.data);
  const canThuoc = request.kieuDuDoan !== "DISEASE_TO_DRUG";
  const canBenh = request.kieuDuDoan !== "DRUG_TO_DISEASE";

  function update(key, value) {
    setRequest((current) => ({ ...current, [key]: value }));
  }

  function updatePredictionType(value) {
    setRequest((current) => ({
      ...current,
      kieuDuDoan: value,
      thuocId: value === "DISEASE_TO_DRUG" ? "" : current.thuocId,
      benhId: value === "DRUG_TO_DISEASE" ? "" : current.benhId,
    }));
    setValidationErrors([]);
    setError("");
  }

  function validate() {
    const errors = [];
    if (canThuoc && !request.thuocId) errors.push("Vui lòng chọn thuốc đầu vào.");
    if (canBenh && !request.benhId) errors.push("Vui lòng chọn bệnh đầu vào.");
    const soLuong = Number(request.soLuongKetQua);
    if (!Number.isInteger(soLuong) || soLuong < 1 || soLuong > 100) {
      errors.push("Số lượng kết quả phải từ 1 đến 100.");
    }
    const nguong = Number(request.nguongDiem);
    if (Number.isNaN(nguong) || nguong < 0 || nguong > 1) {
      errors.push("Ngưỡng điểm phải nằm trong khoảng 0 đến 1.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(request.emailLienHe).trim())) {
      errors.push("Email liên hệ không đúng định dạng.");
    }
    if (!request.daChapNhanCanhBaoYTe) {
      errors.push("Vui lòng xác nhận cảnh báo y tế trước khi gửi dự đoán.");
    }
    return errors;
  }

  function buildPayload() {
    return {
      kieuDuDoan: request.kieuDuDoan,
      thuocId: canThuoc ? Number(request.thuocId) : null,
      benhId: canBenh ? Number(request.benhId) : null,
      soLuongKetQua: Number(request.soLuongKetQua),
      nguongDiem: Number(request.nguongDiem),
      mucDich: request.mucDich?.trim() || null,
      emailLienHe: request.emailLienHe.trim(),
      daChapNhanCanhBaoYTe: request.daChapNhanCanhBaoYTe,
    };
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setValidationErrors([]);
    setResponse(null);
    const errors = validate();
    if (errors.length) {
      setValidationErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      setResponse(await api.createPrediction(buildPayload()));
    } catch (err) {
      setError(err.message || "Không tạo được yêu cầu dự đoán.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page two-column">
      <div>
        <TieuDeTrang title="Tạo yêu cầu dự đoán" subtitle="POST /api/du-doan" />
        <CanhBaoYTe />

        <form className="panel form-grid" onSubmit={submit}>
          <label>
            Kiểu dự đoán
            <select value={request.kieuDuDoan} onChange={(event) => updatePredictionType(event.target.value)}>
              {predictionTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Thuốc đầu vào
            <select
              value={request.thuocId}
              disabled={!canThuoc || thuoc.loading}
              onChange={(event) => update("thuocId", event.target.value)}
            >
              <option value="">{canThuoc ? "Chọn thuốc" : "Không cần chọn"}</option>
              {danhSachThuoc.map((item) => (
                <option key={item.thuocId} value={item.thuocId}>
                  {item.tenThuoc} {item.maThuoc ? `- ${item.maThuoc}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Bệnh đầu vào
            <select
              value={request.benhId}
              disabled={!canBenh || benh.loading}
              onChange={(event) => update("benhId", event.target.value)}
            >
              <option value="">{canBenh ? "Chọn bệnh" : "Không cần chọn"}</option>
              {danhSachBenh.map((item) => (
                <option key={item.benhId} value={item.benhId}>
                  {item.tenBenh} {item.maBenh ? `- ${item.maBenh}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Số lượng kết quả
            <input
              type="number"
              min="1"
              max="100"
              value={request.soLuongKetQua}
              onChange={(event) => update("soLuongKetQua", event.target.value)}
            />
          </label>

          <label>
            Ngưỡng điểm
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={request.nguongDiem}
              onChange={(event) => update("nguongDiem", event.target.value)}
            />
          </label>

          <label>
            Email liên hệ
            <input
              type="email"
              value={request.emailLienHe}
              placeholder="user@example.com"
              onChange={(event) => update("emailLienHe", event.target.value)}
            />
          </label>

          <label className="wide">
            Mục đích
            <textarea value={request.mucDich} onChange={(event) => update("mucDich", event.target.value)} />
          </label>

          <label className="checkbox wide">
            <input
              type="checkbox"
              checked={request.daChapNhanCanhBaoYTe}
              onChange={(event) => update("daChapNhanCanhBaoYTe", event.target.checked)}
            />
            Tôi xác nhận kết quả chỉ dùng để học tập, nghiên cứu và tham khảo.
          </label>

          {validationErrors.length > 0 && (
            <div className="validation-box wide">
              <strong>Vui lòng kiểm tra lại thông tin:</strong>
              <ul>
                {validationErrors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {error && <p className="error wide">{error}</p>}

          <button className="primary wide" disabled={submitting || thuoc.loading || benh.loading}>
            <Send size={16} />
            {submitting ? "Đang gửi..." : "Gửi yêu cầu dự đoán"}
          </button>
        </form>
      </div>

      <BangKetQuaDuDoanMoi response={response} />
    </section>
  );
}

function BangKetQuaDuDoanMoi({ response }) {
  if (!response) {
    return (
      <aside className="panel empty-panel">
        <ClipboardList size={32} />
        <h3>Kết quả dự đoán</h3>
        <p>Kết quả xếp hạng sẽ hiển thị ở đây sau khi backend lưu vào YeuCauDuDoan và KetQuaDuDoan.</p>
      </aside>
    );
  }

  const results = response.results ?? [];

  return (
    <aside className="panel result-panel">
      <h3>{response.maYeuCau || response.requestCode}</h3>
      <span className="status">{response.trangThaiYeuCau || response.requestStatus}</span>
      <p className="muted">{response.resultMessage}</p>

      {results.length === 0 ? (
        <div className="no-result-box">
          <strong>Không có kết quả phù hợp</strong>
          <p>Thử giảm ngưỡng điểm, tăng số lượng kết quả hoặc chọn cặp thuốc - bệnh khác.</p>
        </div>
      ) : (
        <div className="table-wrap prediction-table">
          <table>
            <thead>
              <tr>
                <th>Thứ hạng</th>
                <th>Tên thuốc</th>
                <th>Tên bệnh</th>
                <th>Điểm dự đoán</th>
                <th>Mức tin cậy</th>
                <th>Loại liên kết</th>
                <th>Giải thích ngắn</th>
                <th>Cảnh báo y tế</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.ketQuaDuDoanId || result.predictionResultId}>
                  <td>{result.thuHang || result.rankNo}</td>
                  <td>{result.tenThuoc || result.drugName}</td>
                  <td>{result.tenBenh || result.diseaseName}</td>
                  <td>{formatScore(result.diemDuDoan ?? result.predictionScore)}</td>
                  <td>{result.tenMucTinCay || result.confidenceLevel || "-"}</td>
                  <td>{result.tenLoaiLienKet || result.linkType || "-"}</td>
                  <td className="muted">{result.giaiThichNgan || result.explanationText || "-"}</td>
                  <td className="muted">{result.canhBaoYTe || result.warningText || CANH_BAO_Y_TE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </aside>
  );
}

function ManHinhLichSuDuDoanMoi({
  title = "Lịch sử dự đoán",
  subtitle = "GET /api/du-doan/lich-su",
}) {
  const { data, loading, error } = useLoad(() => api.getPredictionHistory(), []);
  return (
    <section className="page">
      <TieuDeTrang title={title} subtitle={subtitle} />
      <TrangThaiDuLieu loading={loading} error={error}>
        {(data ?? []).length === 0 ? (
          <EmptyState title="Chưa có lịch sử" text="Các yêu cầu dự đoán mới sẽ xuất hiện tại đây." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã yêu cầu</th>
                <th>Kiểu dự đoán</th>
                <th>Thuốc đầu vào</th>
                <th>Bệnh đầu vào</th>
                <th>Trạng thái</th>
                <th>Số kết quả</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((item) => (
                <tr key={item.yeuCauDuDoanId || item.requestId}>
                  <td>{item.maYeuCau || item.requestCode}</td>
                  <td>{item.kieuDuDoan || item.predictionType}</td>
                  <td>{item.tenThuocDauVao || item.inputDrugName || "-"}</td>
                  <td>{item.tenBenhDauVao || item.inputDiseaseName || "-"}</td>
                  <td><span className="status">{item.trangThaiYeuCau || item.requestStatus}</span></td>
                  <td>{item.soKetQua ?? item.resultCount}</td>
                  <td>{item.ngayTao || item.createdAt ? new Date(item.ngayTao || item.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TrangThaiDuLieu>
    </section>
  );
}

function ManHinhPhanHoiMoi() {
  const lichSu = useLoad(() => api.getPredictionHistory(), []);
  const [yeuCauId, setYeuCauId] = useState("");
  const [ketQuaId, setKetQuaId] = useState("");
  const [form, setForm] = useState({
    danhGia: "Hợp lý",
    nhanXet: "",
    nguonThamKhaoBoSung: "",
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const chiTiet = useLoad(
    () => (yeuCauId ? api.getPrediction(yeuCauId) : Promise.resolve(null)),
    [yeuCauId],
  );
  const results = chiTiet.data?.results ?? [];

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setResponse(null);
    if (!ketQuaId) {
      setError("Vui lòng chọn một kết quả dự đoán để phản hồi.");
      return;
    }
    try {
      setResponse(
        await api.createFeedback({
          ketQuaDuDoanId: Number(ketQuaId),
          danhGia: form.danhGia,
          nhanXet: form.nhanXet || null,
          nguonThamKhaoBoSung: form.nguonThamKhaoBoSung || null,
        }),
      );
    } catch (err) {
      setError(err.message || "Không gửi được phản hồi.");
    }
  }

  return (
    <section className="page">
      <TieuDeTrang title="Gửi phản hồi" subtitle="POST /api/phan-hoi-ket-qua" />
      <form className="panel form-grid" onSubmit={submit}>
        <label>
          Yêu cầu dự đoán
          <select
            value={yeuCauId}
            onChange={(event) => {
              setYeuCauId(event.target.value);
              setKetQuaId("");
            }}
            disabled={lichSu.loading}
          >
            <option value="">Chọn yêu cầu đã gửi</option>
            {(lichSu.data ?? []).map((item) => (
              <option key={item.yeuCauDuDoanId || item.requestId} value={item.yeuCauDuDoanId || item.requestId}>
                {item.maYeuCau || item.requestCode} - {item.kieuDuDoan || item.predictionType}
              </option>
            ))}
          </select>
        </label>

        <label>
          Kết quả cần phản hồi
          <select value={ketQuaId} onChange={(event) => setKetQuaId(event.target.value)} disabled={!yeuCauId || chiTiet.loading}>
            <option value="">Chọn kết quả</option>
            {results.map((item) => (
              <option key={item.ketQuaDuDoanId || item.predictionResultId} value={item.ketQuaDuDoanId || item.predictionResultId}>
                #{item.thuHang || item.rankNo} {item.tenThuoc || item.drugName} → {item.tenBenh || item.diseaseName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Đánh giá
          <select value={form.danhGia} onChange={(event) => update("danhGia", event.target.value)}>
            <option>Hợp lý</option>
            <option>Chưa hợp lý</option>
            <option>Cần kiểm chứng thêm</option>
            <option>Không đủ thông tin để đánh giá</option>
          </select>
        </label>

        <label className="wide">
          Nhận xét
          <textarea value={form.nhanXet} onChange={(event) => update("nhanXet", event.target.value)} />
        </label>

        <label className="wide">
          Nguồn tham khảo bổ sung
          <textarea value={form.nguonThamKhaoBoSung} onChange={(event) => update("nguonThamKhaoBoSung", event.target.value)} />
        </label>

        {error && <p className="error wide">{error}</p>}
        {response && <p className="success wide">Đã tạo phản hồi thành công.</p>}

        <button className="primary wide">
          <MessageSquare size={16} />
          Gửi phản hồi
        </button>
      </form>
    </section>
  );
}

function ManHinhDuDoan() {
  const lookups = useLoad(() => api.getLookups(), []);
  const MAX_SQL_INT = 2147483647;

  const [request, setRequest] = useState({
    predictionType: "DRUG_TO_DISEASE",
    drugId: "",
    diseaseId: "",
    topK: 10,
    scoreThreshold: 0.5,
    purpose: "Nghiên cứu liên kết thuốc - bệnh",
    contactEmail: "",
    medicalWarningAccepted: false,
  });

  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const predictionTypes = lookups.data?.predictionTypes ?? [
    { code: "DRUG_TO_DISEASE", name: "Từ thuốc tìm bệnh" },
    { code: "DISEASE_TO_DRUG", name: "Từ bệnh tìm thuốc" },
    { code: "PAIR_PREDICTION", name: "Dự đoán một cặp thuốc - bệnh" },
  ];

  const update = (key, value) => {
    setRequest((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updatePredictionType = (value) => {
    setRequest((current) => ({
      ...current,
      predictionType: value,
      drugId: value === "DISEASE_TO_DRUG" ? "" : current.drugId,
      diseaseId: value === "DRUG_TO_DISEASE" ? "" : current.diseaseId,
    }));

    setValidationErrors([]);
    setError("");
  };

  const isDrugIdDisabled = request.predictionType === "DISEASE_TO_DRUG";

  const isDiseaseIdDisabled = request.predictionType === "DRUG_TO_DISEASE";

  function validateRequiredId(value, fieldName) {
    const rawValue = String(value ?? "").trim();

    if (!rawValue) {
      return `${fieldName} không được để trống.`;
    }

    if (!/^\d+$/.test(rawValue)) {
      return `${fieldName} chỉ được nhập số nguyên dương.`;
    }

    const numericValue = Number(rawValue);

    if (!Number.isSafeInteger(numericValue)) {
      return `${fieldName} vượt mức cho phép.`;
    }

    if (numericValue <= 0) {
      return `${fieldName} phải lớn hơn 0.`;
    }

    if (numericValue > MAX_SQL_INT) {
      return `${fieldName} vượt mức cho phép của SQL Server INT. Giá trị tối đa là ${MAX_SQL_INT}.`;
    }

    return "";
  }

  function validateEmail(value) {
    const email = String(value ?? "").trim();

    if (!email) {
      return "Vui lòng nhập email liên hệ.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return "Email liên hệ không đúng định dạng.";
    }

    return "";
  }

  function validatePredictionForm() {
    const errors = [];
    const type = request.predictionType;

    if (!type) {
      errors.push("Vui lòng chọn loại dự đoán.");
    }

    if (type === "DRUG_TO_DISEASE") {
      const drugError = validateRequiredId(request.drugId, "DrugId");

      if (drugError) {
        errors.push("Từ thuốc tìm bệnh cần nhập DrugId.");
        errors.push(drugError);
      }
    }

    if (type === "DISEASE_TO_DRUG") {
      const diseaseError = validateRequiredId(request.diseaseId, "DiseaseId");

      if (diseaseError) {
        errors.push("Từ bệnh tìm thuốc cần nhập DiseaseId.");
        errors.push(diseaseError);
      }
    }

    if (type === "PAIR_PREDICTION") {
      const drugError = validateRequiredId(request.drugId, "DrugId");

      const diseaseError = validateRequiredId(request.diseaseId, "DiseaseId");

      if (drugError || diseaseError) {
        errors.push(
          "Dự đoán một cặp thuốc - bệnh cần nhập cả DrugId và DiseaseId.",
        );
      }

      if (drugError) {
        errors.push(drugError);
      }

      if (diseaseError) {
        errors.push(diseaseError);
      }
    }

    const topK = Number(request.topK);

    if (!Number.isInteger(topK) || topK <= 0 || topK > 100) {
      errors.push("TopK phải là số nguyên từ 1 đến 100.");
    }

    const scoreThreshold = Number(request.scoreThreshold);

    if (
      Number.isNaN(scoreThreshold) ||
      scoreThreshold < 0 ||
      scoreThreshold > 1
    ) {
      errors.push("Ngưỡng điểm phải nằm trong khoảng từ 0 đến 1.");
    }

    const emailError = validateEmail(request.contactEmail);

    if (emailError) {
      errors.push(emailError);
    }

    if (!request.medicalWarningAccepted) {
      errors.push(
        'Vui lòng tích vào ô "Tôi xác nhận kết quả chỉ dùng để hỗ trợ tham khảo, không thay thế tư vấn y khoa."',
      );
    }

    return [...new Set(errors)];
  }

  function buildPayload() {
    const type = request.predictionType;

    return {
      predictionType: type,
      drugId: type === "DISEASE_TO_DRUG" ? null : Number(request.drugId),
      diseaseId: type === "DRUG_TO_DISEASE" ? null : Number(request.diseaseId),
      topK: Number(request.topK),
      scoreThreshold: Number(request.scoreThreshold),
      purpose: request.purpose?.trim() || null,
      contactEmail: request.contactEmail.trim(),
      medicalWarningAccepted: request.medicalWarningAccepted,
    };
  }

  async function submit(event) {
    event.preventDefault();

    setError("");
    setValidationErrors([]);
    setResponse(null);

    const errors = validatePredictionForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload();
      setResponse(await api.createPrediction(payload));
    } catch (err) {
      setError(err.message || "Không tạo được yêu cầu dự đoán.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page two-column">
      <div>
        <TieuDeTrang
          title="Tạo yêu cầu dự đoán"
          subtitle="POST /api/du-doan"
        />

        <form className="panel form-grid" onSubmit={submit}>
          <label>
            Loại dự đoán
            <select
              value={request.predictionType}
              onChange={(event) => updatePredictionType(event.target.value)}
            >
              {predictionTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.code} - {type.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            DrugId
            <input
              type="number"
              min="1"
              max={MAX_SQL_INT}
              value={request.drugId}
              disabled={isDrugIdDisabled}
              placeholder={
                isDrugIdDisabled
                  ? "Không cần nhập khi từ bệnh tìm thuốc"
                  : "Nhập ID thuốc"
              }
              onChange={(event) => update("drugId", event.target.value)}
            />
          </label>

          <label>
            DiseaseId
            <input
              type="number"
              min="1"
              max={MAX_SQL_INT}
              value={request.diseaseId}
              disabled={isDiseaseIdDisabled}
              placeholder={
                isDiseaseIdDisabled
                  ? "Không cần nhập khi từ thuốc tìm bệnh"
                  : "Nhập ID bệnh"
              }
              onChange={(event) => update("diseaseId", event.target.value)}
            />
          </label>

          <label>
            TopK
            <input
              type="number"
              min="1"
              max="100"
              value={request.topK}
              onChange={(event) => update("topK", event.target.value)}
            />
          </label>

          <label>
            Ngưỡng điểm
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={request.scoreThreshold}
              onChange={(event) => update("scoreThreshold", event.target.value)}
            />
          </label>

          <label>
            Email liên hệ
            <input
              type="email"
              value={request.contactEmail}
              placeholder="Ví dụ: user@example.com"
              onChange={(event) => update("contactEmail", event.target.value)}
            />
          </label>

          <label className="wide">
            Mục đích
            <textarea
              value={request.purpose}
              onChange={(event) => update("purpose", event.target.value)}
            />
          </label>

          <label className="checkbox wide">
            <input
              type="checkbox"
              checked={request.medicalWarningAccepted}
              onChange={(event) =>
                update("medicalWarningAccepted", event.target.checked)
              }
            />
            Tôi xác nhận kết quả chỉ dùng để hỗ trợ tham khảo, không thay thế tư
            vấn y khoa.
          </label>

          {validationErrors.length > 0 && (
            <div className="validation-box wide">
              <strong>Vui lòng kiểm tra lại thông tin:</strong>
              <ul>
                {validationErrors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="error wide">{error}</p>}

          <button className="primary wide" disabled={submitting}>
            <Send size={16} />
            {submitting ? "Đang gửi..." : "Gửi yêu cầu dự đoán"}
          </button>
        </form>
      </div>

      <BangKetQuaDuDoan response={response} />
    </section>
  );
}

function BangKetQuaDuDoan({ response }) {
  if (!response) {
    return (
      <aside className="panel empty-panel">
        <ClipboardList size={32} />
        <h3>Kết quả dự đoán</h3>
        <p>
          Backend sẽ trả về mã request, mã run và danh sách kết quả xếp hạng tại
          đây.
        </p>
      </aside>
    );
  }

  const results = response.results ?? [];
  const hasNoResults = results.length === 0;

  return (
    <aside className="panel">
      <h3>{response.requestCode}</h3>

      <p className="muted">
        Run: {response.runCode || response.predictionRunId}
      </p>

      <span className="status">{response.requestStatus}</span>

      {hasNoResults ? (
        <div className="no-result-box">
          <strong>Không có kết quả phù hợp</strong>

          <p>
            {response.resultMessage ||
              `Không có kết quả nào đạt ngưỡng điểm ${
                response.scoreThreshold ?? "đã chọn"
              }.`}
          </p>

          <small>
            Gợi ý: bạn có thể giảm ngưỡng điểm, tăng TopK hoặc thử cặp thuốc -
            bệnh khác.
          </small>
        </div>
      ) : (
        <div className="result-list">
          {results.map((result) => (
            <article key={result.predictionResultId} className="result-item">
              <strong>
                #{result.rankNo} {result.drugName} → {result.diseaseName}
              </strong>

              <span>{formatScore(result.predictionScore)}</span>

              <small>
                {result.confidenceLevel || "Không rõ"} -{" "}
                {result.linkType || "Chưa phân loại"}
              </small>

              <p>{result.explanationText}</p>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function ManHinhLichSuDuDoan({
  title = "Lịch sử dự đoán",
  subtitle = "GET /api/du-doan/lich-su",
}) {
  const { data, loading, error } = useLoad(
    () => api.getPredictionHistory(),
    [],
  );
  return (
    <section className="page">
      <TieuDeTrang title={title} subtitle={subtitle} />
      <TrangThaiDuLieu loading={loading} error={error}>
        <table>
          <thead>
            <tr>
              <th>Mã request</th>
              <th>Loại</th>
              <th>Thuốc</th>
              <th>Bệnh</th>
              <th>Trạng thái</th>
              <th>Số kết quả</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((item) => (
              <tr key={item.requestId}>
                <td>{item.requestCode}</td>
                <td>{item.predictionType}</td>
                <td>{item.inputDrugName || "-"}</td>
                <td>{item.inputDiseaseName || "-"}</td>
                <td>
                  <span className="status">{item.requestStatus}</span>
                </td>
                <td>{item.resultCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TrangThaiDuLieu>
    </section>
  );
}

function ManHinhPhanHoi() {
  const [form, setForm] = useState({
    predictionRunId: "",
    predictionResultId: "",
    userId: "",
    generalAssessment: "Hợp lý",
    usefulScore: 5,
    suggestedAction: "Giữ kết quả",
    reasonText: "",
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setResponse(null);
    try {
      const payload = {
        ...form,
        predictionRunId: Number(form.predictionRunId),
        predictionResultId: form.predictionResultId
          ? Number(form.predictionResultId)
          : null,
        userId: form.userId ? Number(form.userId) : null,
        usefulScore: form.usefulScore ? Number(form.usefulScore) : null,
      };
      setResponse(await api.createFeedback(payload));
    } catch (err) {
      setError(err.message || "Không gửi được phản hồi.");
    }
  }

  return (
    <section className="page">
      <TieuDeTrang title="Gửi phản hồi" subtitle="POST /api/phan-hoi-ket-qua" />
      <form className="panel form-grid" onSubmit={submit}>
        <label>
          PredictionRunId
          <input
            type="number"
            required
            value={form.predictionRunId}
            onChange={(event) => update("predictionRunId", event.target.value)}
          />
        </label>
        <label>
          PredictionResultId
          <input
            type="number"
            value={form.predictionResultId}
            onChange={(event) =>
              update("predictionResultId", event.target.value)
            }
          />
        </label>
        <label>
          UserId
          <input
            type="number"
            value={form.userId}
            onChange={(event) => update("userId", event.target.value)}
          />
        </label>
        <label>
          Đánh giá
          <input
            required
            value={form.generalAssessment}
            onChange={(event) =>
              update("generalAssessment", event.target.value)
            }
          />
        </label>
        <label>
          Điểm hữu ích
          <input
            type="number"
            min="1"
            max="5"
            value={form.usefulScore}
            onChange={(event) => update("usefulScore", event.target.value)}
          />
        </label>
        <label>
          Hành động đề xuất
          <input
            value={form.suggestedAction}
            onChange={(event) => update("suggestedAction", event.target.value)}
          />
        </label>
        <label className="wide">
          Lý do
          <textarea
            value={form.reasonText}
            onChange={(event) => update("reasonText", event.target.value)}
          />
        </label>
        {error && <p className="error wide">{error}</p>}
        {response && (
          <p className="success wide">
            Đã tạo phản hồi {response.feedbackCode} với ID {response.feedbackId}
            .
          </p>
        )}
        <button className="primary wide">
          <MessageSquare size={16} />
          Gửi phản hồi
        </button>
      </form>
    </section>
  );
}

function ManHinhLookup() {
  const { data, loading, error } = useLoad(() => api.getLookups(), []);
  return (
    <section className="page">
      <TieuDeTrang title="Danh mục backend" subtitle="GET /api/lookups" />
      <TrangThaiDuLieu loading={loading} error={error}>
        <NhomLookup data={data} />
      </TrangThaiDuLieu>
    </section>
  );
}

function TomTatLookup({ lookups }) {
  if (lookups.loading)
    return <div className="panel state">Đang tải danh mục...</div>;
  if (lookups.error)
    return <div className="panel state error">{lookups.error}</div>;
  return (
    <div className="panel">
      <h3>Danh mục backend đang dùng</h3>
      <NhomLookup data={lookups.data} />
    </div>
  );
}

function NhomLookup({ data }) {
  const groups = useMemo(
    () => [
      ["Loại dự đoán", data?.predictionTypes ?? []],
      ["Mức tin cậy", data?.confidenceLevels ?? []],
      ["Loại liên kết", data?.linkTypes ?? []],
      ["Trạng thái bằng chứng", data?.evidenceStatuses ?? []],
    ],
    [data],
  );

  return (
    <div className="lookup-grid">
      {groups.map(([title, items]) => (
        <article className="panel compact-panel" key={title}>
          <h3>{title}</h3>
          <ul className="lookup-list">
            {items.map((item) => (
              <li key={item.id}>
                <code>{item.code}</code>
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
function LuoiChiSo({ cards }) {
  return (
    <div className="metric-grid">
      {cards.map((card) => (
        <article className="metric-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.hint}</small>
        </article>
      ))}
    </div>
  );
}

function TieuDeTrang({ eyebrow, title, subtitle }) {
  return (
    <header className="page-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

function ThanhTimKiem({ value, onChange, onSearch, soDong, onLimitChange }) {
  return (
    <div className="search-bar">
      <Search size={18} />
      <input
        value={value}
        placeholder="Nhập từ khóa..."
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSearch()}
      />
      <label className="limit-select">
        Số dòng
        <select
          value={soDong}
          onChange={(event) => onLimitChange(Number(event.target.value))}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </label>
      <button className="primary" onClick={onSearch}>
        Tìm
      </button>
    </div>
  );
}

function ThongTinGioiHan({ hienThi, tong, loai }) {
  return (
    <div className="data-hint">
      Đang hiển thị {hienThi ?? 0}
      {tong ? ` / ${tong}` : ""} {loai}. Dữ liệu lấy từ API DataThuoc với page/pageSize.
    </div>
  );
}

function GhiChuQuanTri({ children }) {
  return (
    <div className="admin-note">
      <ShieldCheck size={20} />
      <p>{children}</p>
    </div>
  );
}

function TrangThaiDuLieu({ loading, error, children, variant = "table" }) {
  if (loading) return <div className="panel state">Đang tải dữ liệu...</div>;
  if (error) return <div className="panel state error">{error}</div>;
  return <div className={variant === "plain" ? "data-region" : "table-wrap"}>{children}</div>;
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toFixed(4);
}

createRoot(document.getElementById("root")).render(<App />);
