import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchArtshowById } from "../../features/artshowsSlice";
import { fetchUsers } from "../../features/usersSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { motion } from "framer-motion";

const ArtshowArtists = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const { data: users } = useAppSelector((state) => state.users);
  const [showArtists, setShowArtists] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchArtshowById(id));
      dispatch(fetchUsers());
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (artshows && users) {
      const artshow = artshows.find((show) => show.id === id);
      if (artshow) {
        const artists = users.filter((user) =>
          artshow.artistIds?.includes(user.id!)
        );
        setShowArtists(artists);
      }
    }
  }, [artshows, users, id]);

  const artshow = artshows.find((show) => show.id === id);

  if (!artshow) {
    return (
      <div className="p-8">
        <ContentWrapper loading={true}>
          <div className="text-center">Loading...</div>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ContentWrapper loading={false}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {artshow.name} - Artists
            </h1>
            <p className="text-gray-600">
              {new Date(artshow.startDate).toLocaleDateString()} -{" "}
              {new Date(artshow.endDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => navigate("/artshows")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Back to Shows
          </button>
        </div>

        {showArtists.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Artists Found
            </h3>
            <p className="text-gray-500">
              This art show doesn't have any artists yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showArtists.map((artist) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {artist.photoUrl ? (
                        <img
                          src={artist.photoUrl}
                          alt={artist.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-500">
                            {artist.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {artist.name}
                      </h3>
                      <p className="text-sm text-gray-600">{artist.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Status:{" "}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            artist.status === "active"
                              ? "bg-green-100 text-green-800"
                              : artist.status === "shown"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {artist.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  {artist.bio && (
                    <div className="mt-4">
                      <p className="text-gray-700 text-sm">{artist.bio}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default ArtshowArtists;
