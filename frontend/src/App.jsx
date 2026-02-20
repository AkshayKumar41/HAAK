import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import TeacherPortalPage from "./pages/TeacherPortalPage";
import TeacherProfilePage from "./pages/TeacherProfilePage";
import StudentPortalPage from "./pages/StudentPortalPage";
import StudentTestPage from "./pages/StudentTestPage";
import StudentExamPage from "./pages/StudentExamPage";

function TeacherRoute({ element }) {
  const role = localStorage.getItem("IntuMotion_role");
  return role === "teacher" ? element : <Navigate to="/login" replace />;
}

function StudentRoute({ element }) {
  const role = localStorage.getItem("IntuMotion_role");
  return role === "student" ? element : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/teacher" element={<TeacherRoute element={<TeacherPortalPage />} />} />
      <Route path="/teacher/profile" element={<TeacherRoute element={<TeacherProfilePage />} />} />
      <Route path="/student" element={<StudentRoute element={<StudentPortalPage />} />} />
      <Route
        path="/student/classes/:classId/assessments/:assessmentId/test"
        element={<StudentRoute element={<StudentExamPage />} />}
      />
      <Route
        path="/student/classes/:classId/assessments/:assessmentId/practice"
        element={<StudentRoute element={<StudentTestPage />} />}
      />
      <Route
        path="/student/classes/:classId/assessments/:assessmentId/:mode"
        element={<StudentRoute element={<StudentTestPage />} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
