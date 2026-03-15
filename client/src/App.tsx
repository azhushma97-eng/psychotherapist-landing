import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LandingPage from "@/pages/LandingPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground flex-col gap-4">
          <h1 className="text-4xl font-serif font-bold text-primary">404</h1>
          <p className="text-muted-foreground text-lg">Страница не найдена</p>
          <a href="/" className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
            Вернуться на главную
          </a>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
