import Login from "./accounts/login";
import Signup from "./accounts/signup";
import LearnMore from "./accounts/learnmore";
import HomePage from "./home/home";
import CreateCalendar from "./home/create-calendar";
import PersonalPage from "./home/personal";
import MemberPage from "./members/member";
import Schedule from "./calendar/schedule";
import Availability from "./calendar/availability";
import "./globals.css";

export default function App() {
  return (
    <div>
      <Availability />
    </div>
  );
}
