import React, { useEffect, useState } from "react";
import {
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
  Switch,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Container,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import api, { endpoints } from "../services/apis";

const UserList = ({ userType }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | 'add'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', full_name: '', phone: '', is_active: true, role: 'learner', password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  // Khi mở modal edit/add, set formData
  useEffect(() => {
    if (modalType === 'edit' && selectedUser) {
      setFormData({
        username: selectedUser.username || '',
        email: selectedUser.email || '',
        full_name: selectedUser.full_name || '',
        phone: selectedUser.phone || '',
        is_active: selectedUser.is_active,
        role: selectedUser.role || 'learner',
        password: '',
      });
    } else if (modalType === 'add') {
      setFormData({ username: '', email: '', full_name: '', phone: '', is_active: true, role: 'learner', password: '' });
    }
  }, [modalType, selectedUser]);
  // Xử lý thay đổi form
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Submit chỉnh sửa user
  const handleEditUser = async () => {
    try {
      await api.put(endpoints.user.update(selectedUser.id), formData);
      setSnackbar({ open: true, message: 'Cập nhật thành công!', severity: 'success' });
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Cập nhật thất bại!', severity: 'error' });
    }
  };

  // Submit thêm user mới
  const handleAddUser = async () => {
    try {
      await api.post(endpoints.user.create, formData);
      setSnackbar({ open: true, message: 'Thêm mới thành công!', severity: 'success' });
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Thêm mới thất bại!', severity: 'error' });
    }
  };

  // Responsive: Ẩn cột trên màn hình nhỏ
  // Modal handlers
  const handleOpenModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setModalType(null);
    setSelectedUser(null);
  };
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // Reset page về 0 khi search thay đổi
  useEffect(() => {
    setPage(0);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    setUsers([]);
  const params = `search=${search}&limit=${rowsPerPage}&page=${page + 1}`;
    let url;
    if (userType === "instructor") {
      url = endpoints.user.listInstructors(params);
    } else if (userType === "learner") {
      url = endpoints.user.listLearners(params);
    } else if (userType === "center") {
      url = endpoints.user.listCenters(params);
    } else {
      url = endpoints.user.list + (params ? `?${params}` : '');
    }
    const res = await api.get(url);
  // Always use DRF pagination format: results/count
  setUsers(Array.isArray(res.data.results) ? res.data.results : []);
  setTotal(typeof res.data.count === 'number' ? res.data.count : 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [search, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleActive = async (user) => {
    const url = user.is_active
      ? endpoints.user.deactivate(user.id)
      : endpoints.user.activate(user.id);
    await api.post(url);
    fetchUsers();
  };

  return (
    <Container maxWidth="lg" sx={{ px: 3, py: 2 }}>
      <Paper sx={{ p: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <TextField
            label="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ width: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal('add')}
          >
            {userType === 'all' ? 'Add User' : userType === 'instructor' ? 'Add Instructor' : 'Add Learner'}
          </Button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>Đang tải dữ liệu...</div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <TableContainer sx={{ minWidth: 650 }}>
              <Table key={page}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '10%' }}>Avatar</TableCell>
                    <TableCell sx={{ width: '15%' }}>Username</TableCell>
                    <TableCell sx={{ width: '20%' }}>Email</TableCell>
                    {!isSmallScreen && <TableCell sx={{ width: '15%' }}>Phone</TableCell>}
                    <TableCell sx={{ width: '10%' }}>Status</TableCell>
                    {!isSmallScreen && <TableCell sx={{ width: '10%' }}>Created At</TableCell>}
                    <TableCell align="right" sx={{ width: '20%' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell sx={{ width: '10%' }}><Avatar src={user.avatar} alt={user.username} /></TableCell>
                      <TableCell sx={{ width: '15%' }}>{user.username}</TableCell>
                      <TableCell sx={{ width: '20%' }}>{user.email}</TableCell>
                      {!isSmallScreen && <TableCell sx={{ width: '15%' }}>{user.phone}</TableCell>}
                      <TableCell sx={{ width: '10%' }}>
                        <Switch
                          checked={user.is_active}
                          onChange={() => handleToggleActive(user)}
                          color={user.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      {!isSmallScreen && <TableCell sx={{ width: '15%' }}>{new Date(user.created_at).toLocaleDateString()}</TableCell>}
                      <TableCell align="right" sx={{ width: '15%' }}>
                        <Tooltip title="View">
                          <IconButton color="primary" onClick={() => handleOpenModal('view', user)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton color="secondary" onClick={() => handleOpenModal('edit', user)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
        {/* Modal cho View, Edit, Add User */}
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogTitle>
            {modalType === 'view' && 'Xem thông tin người dùng'}
            {modalType === 'edit' && 'Chỉnh sửa người dùng'}
            {modalType === 'add' && (userType === 'all' ? 'Thêm người dùng' : userType === 'instructor' ? 'Thêm giảng viên' : userType ==='learner' ? 'Thêm học viên' : 'Thêm trung tâm')}
          </DialogTitle>
          <DialogContent dividers>
            {modalType === 'view' && selectedUser && (
              <div>
                <Avatar src={selectedUser.avatar} alt={selectedUser.username} sx={{ width: 64, height: 64, mb: 2 }} />
                <div><b>Username:</b> {selectedUser.username}</div>
                <div><b>Email:</b> {selectedUser.email}</div>
                <div><b>Phone:</b> {selectedUser.phone}</div>
                <div><b>Status:</b> {selectedUser.is_active ? 'Active' : 'Inactive'}</div>
                <div><b>Role:</b> {selectedUser.role}</div>
                <div><b>Created At:</b> {new Date(selectedUser.created_at).toLocaleString()}</div>
              </div>
            )}
            {modalType === 'edit' && selectedUser && (
              <form onSubmit={e => { e.preventDefault(); handleEditUser(); }}>
                <TextField
                  margin="normal"
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
                <TextField
                  margin="normal"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
                <TextField
                  margin="normal"
                  label="Họ và tên"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  margin="normal"
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  fullWidth
                />
                <FormControl margin="normal" fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={handleFormChange}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="instructor">Instructor</MenuItem>
                    <MenuItem value="learner">Learner</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                  </Select>
                </FormControl>
              </form>
            )}
            {modalType === 'add' && (
              <form onSubmit={e => { e.preventDefault(); handleAddUser(); }}>
                <TextField
                  margin="normal"
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
                <TextField
                  margin="normal"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
                <TextField
                  margin="normal"
                  label="Họ và tên"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleFormChange}
                  fullWidth
                />
                <TextField
                  margin="normal"
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  fullWidth
                />
                <FormControl margin="normal" fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={handleFormChange}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="instructor">Instructor</MenuItem>
                    <MenuItem value="learner">Learner</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  margin="normal"
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </form>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Đóng</Button>
            {modalType === 'edit' && (
              <Button onClick={handleEditUser} variant="contained" color="primary">Lưu</Button>
            )}
            {modalType === 'add' && (
              <Button onClick={handleAddUser} variant="contained" color="primary">Tạo mới</Button>
            )}
          </DialogActions>
        {/* Snackbar thông báo */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        </Dialog>
                        <Tooltip title={user.is_active ? "Deactivate" : "Activate"}>
                          <IconButton color={user.is_active ? "error" : "success"} onClick={() => handleToggleActive(user)}>
                            {user.is_active ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>   

  );
};

export default UserList;
