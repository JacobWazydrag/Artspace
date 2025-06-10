import { useAppSelector } from "../../hooks/storeHook";
import ContentWrapper from "../../components/ContentWrapper";
import {
  UsersIcon,
  MapPinIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { formClasses } from "../../classes/tailwindClasses";

const Dashboard = () => {
  const { data: profile } = useAppSelector((state) => state.profile);
  const { data: users } = useAppSelector((state) => state.users);
  const { data: locations } = useAppSelector((state) => state.locations);
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const { h1ReverseDark, pReverseDark } = formClasses;
  const stats = [
    {
      name: "Total Users",
      value: users?.length || 0,
      icon: UsersIcon,
      color: "bg-blue-500",
    },
    {
      name: "Locations",
      value: locations?.length || 0,
      icon: MapPinIcon,
      color: "bg-green-500",
    },
    {
      name: "Art Shows",
      value: artshows?.length || 0,
      icon: CalendarDaysIcon,
      color: "bg-purple-500",
    },
    {
      name: "Mediums",
      value: mediums?.length || 0,
      icon: Squares2X2Icon,
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="p-8">
      <ContentWrapper>
        <div className="mb-8">
          <h1 className={h1ReverseDark}>Welcome to your Dashboard</h1>
          <p className={pReverseDark}>
            You are an admin with the role: {profile?.role}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow p-6 flex items-center"
            >
              <div className={`${stat.color} p-3 rounded-lg text-white mr-4`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <p className="text-gray-600">No recent activity to display.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <p className="text-gray-600">No quick actions available.</p>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default Dashboard;
