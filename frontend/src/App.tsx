import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './Student/components/Navbar';
import StudentLogin from './Student/pages/Login';
import AdminLogin from './Admin/pages/Login';
import Home from './Student/pages/Home';
import SelectTopics from './Student/pages/SelectTopics';
import ResourceDetails from './Student/pages/ResourceDetails';
import Profile from './Student/pages/Profile';
import Resources from './Admin/pages/Resources';
import Curriculum from './Admin/pages/Curriculum';
import ResourceForm from './Admin/pages/ResourceForm';
import ManageAdmins from './Admin/pages/ManageAdmins';
import Layout from './Admin/components/Layout';
import { Toaster } from "react-hot-toast";


const MainLayout = () => {
  return (
    <div>
      <Navbar/>
      <Outlet />
    </div>
  );
};

const AdminMainLayout = () => {
  return (
      <Layout>
        <Outlet />
      </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Public Route */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/student/input_topics" element={<SelectTopics />} />

        {/* Protected Routes (Wrapped in Layout) */}
        <Route element={<MainLayout />}>
           {/* Redirect root "/" to "/home" */}
           <Route path="/" element={<Navigate to="/home" replace />} />
           
           <Route path="/home" element={<Home />} />
           <Route path="/resource/:resource_id" element={<ResourceDetails />} />
           <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<AdminMainLayout />}>
          <Route path="/admin" element={<Navigate to="/resource" replace />} />
          <Route path="/resource" element={<Resources/>}></Route>
          <Route path="/resource/edit/:resource_id" element={<ResourceForm/>}></Route>
          <Route path="/resource/create" element={<ResourceForm/>}></Route>
          <Route path="/manage-admins" element={<ManageAdmins/>}></Route>
          <Route path="/curriculum" element={<Curriculum/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;