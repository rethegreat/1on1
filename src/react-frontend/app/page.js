import Login from "./login/login";
import Signup from "./signup/page";
import HomePage from "./home/page";
import CreateCalendar from "./createCalendar/page";
import PersonalPage from "./personal/page";
// import CalendarDetail from "./calendars/[calendar_id]/page";
import MemberPage from "./member/page";
import Schedule from "./schedule/page";
import Availability from "./availability/page";
import UserAvailability from "./calendars/[calendar_id]/availability/[member_hash]/page";
import "./globals.css";

export default function App() {
  return (
    <Login />
  );
}
