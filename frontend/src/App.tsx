import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './Student/components/Navbar';
import Login from './pages/Login';
import Home from './Student/pages/Home';
import Recommendations from './Student/pages/Recommendations';
import RecommendationPage from './Student/pages/RecommendationPage';
import RecommendationPageStudent from './Student/pages/RecommendationPageStudent';
import StudentTopics from './Student/pages/StudentTopics';
import SurveyAssessment from './Student/pages/SurveyAssessment';
import StudentGuard from './Student/pages/StudentGuard';
import ResourceDetails from './Student/pages/ResourceDetails';
//import Profile from './Student/pages/Profile';
import Resources from './Admin/pages/Resources';
import Organizers from './Admin/pages/Organizers';
import Topics from './Admin/pages/Topics';
import EventRoster from './Admin/pages/EventRoster';
import Dashboard from './Admin/pages/Dashboard';
import Configuration from './Admin/pages/Configuration';
import SupportLackGap from "./Admin/pages/dashboards/SupportLackGap";
import ResourceCharacteristic from "./Admin/pages/dashboards/ResourceCharacteristic";
import OrganizerSupport from "./Admin/pages/dashboards/OrganizerSupport";
import StudentPerformance from "./Admin/pages/dashboards/StudentPerformance";
import StudentComparison from "./Admin/pages/dashboards/StudentComparison";
import StudentHistory from "./Admin/pages/dashboards/StudentHistory";
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
        <Route path="/recommendation_result" element={<RecommendationPage />} />
        <Route path="/recommendation_result_student" element={<RecommendationPageStudent />} />
        <Route element={<StudentGuard />}>
          <Route path="/student/topics" element={<StudentTopics />} />
          <Route path="/student/input_topics" element={<Navigate to="/student/topics" replace />} />
          <Route path="/student/survey_assessment" element={<SurveyAssessment />} />

          {/* Protected Routes (Wrapped in Layout) */}
          <Route element={<MainLayout />}>
            {/* Redirect root "/" to "/home" */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            <Route path="/home" element={<Home />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/resource/:resource_id" element={<ResourceDetails />} />
            {/* <Route path="/profile" element={<Profile />} /> */}
          </Route>
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
          <Route path="/dashboard" element={<Dashboard/>}></Route>
          <Route path="/configuration" element={<Configuration/>}></Route>

          <Route path="/support_lack_gap" element={<SupportLackGap/>}></Route>
          <Route path="/resource_characteristic" element={<ResourceCharacteristic/>}></Route>
          <Route path="/organizer_support" element={<OrganizerSupport/>}></Route>
          <Route path="/student_performance" element={<StudentPerformance/>}></Route>
          <Route path="/student_comparison" element={<StudentComparison/>}></Route>
          <Route path="/student_history" element={<StudentHistory/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;