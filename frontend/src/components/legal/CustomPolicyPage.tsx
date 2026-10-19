import { useParams } from "react-router-dom";
import PolicyPageView from "./PolicyPageView";
import NotFound from "../NotFound";

export default function CustomPolicyPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <NotFound />;
  }

  return <PolicyPageView slug={slug} />;
}

