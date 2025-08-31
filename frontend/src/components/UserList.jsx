import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar, TextField, IconButton, Tooltip, Switch, TablePagination
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

  const fetchUsers = async () => {
    setLoading(true);
    const params = `search=${search}&limit=${rowsPerPage}&offset=${page * rowsPerPage}`;
    let url;
    if (userType === "instructor") {
      url = endpoints.user.listInstructors(params);
    } else if (userType === "learner") {
      url = endpoints.user.listLearners(params);
    } else {
      url = endpoints.user.list + (params ? `?${params}` : '');
    }
    const res = await api.get(url);
    setUsers(res.data.results || res.data);
    setTotal(res.data.count || res.data.length || 0);
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
    <Paper sx={{ p: 2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 250 }}
        />
        <Button variant="contained" startIcon={<AddIcon />}>
          {userType === 'all' ? 'Add User' : userType === 'instructor' ? 'Add Instructor' : 'Add Learner'}
        </Button>
      </div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell><Avatar src={user.avatar} alt={user.username} /></TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.is_active}
                    onChange={() => handleToggleActive(user)}
                    color={user.is_active ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton color="primary">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton color="secondary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
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
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default UserList;
