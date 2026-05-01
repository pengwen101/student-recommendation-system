import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './Student/components/Navbar';
import Login from './pages/Login';
import Home from './Student/pages/Home';
import SelectTopics from './Student/pages/SelectTopics';
import ResourceDetails from './Student/pages/ResourceDetails';
import Profile from './Student/pages/Profile';
import Resources from './Admin/pages/Resources';
import Organizers from './Admin/pages/Organizers';
import Topics from './Admin/pages/Topics';
import EventRoster from './Admin/pages/EventRoster';
import OrganizerForm from './Admin/pages/OrganizerForm';
import TopicForm from './Admin/pages/TopicForm';
import Curriculum from './Admin/pages/Curriculum';
import ResourceForm from './Admin/pages/ResourceForm';
import ManageAdmins from './Admin/pages/ManageAdmins';
import Layout from './Admin/components/Layout';
import AuthCatcher from './components/AuthCatcher';
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
      <AuthCatcher />
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
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
          <Route path="/resource/roster/:resource_id" element={<EventRoster/>}></Route>
          <Route path="/organizer" element={<Organizers/>}></Route>
          <Route path="/organizer/edit/:organizer_id" element={<OrganizerForm/>}></Route>
          <Route path="/organizer/create" element={<OrganizerForm/>}></Route>
          <Route path="/topic" element={<Topics/>}></Route>
          <Route path="/topic/edit/:topic_id" element={<TopicForm/>}></Route>
          <Route path="/topic/create" element={<TopicForm/>}></Route>
          <Route path="/manage-admins" element={<ManageAdmins/>}></Route>
          <Route path="/curriculum" element={<Curriculum/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;