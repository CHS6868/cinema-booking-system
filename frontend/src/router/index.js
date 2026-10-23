import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import MovieDetailsView from "../views/MovieDetailsView.vue";
import SeatSelectionView from "../views/SeatSelectionView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView
    },

    {
      path: "/movies/:id",
      name: "movie-details",
      component: MovieDetailsView
    },

    {
      path: "/showtimes/:id/seats",
      name: "seats",
      component: SeatSelectionView
    }
  ]
});

export default router;


