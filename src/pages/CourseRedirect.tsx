import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serverURL } from '@/constants';
import { InlineLoader } from '@/components/ui/loading';

/**
 * Redirect component for legacy ID-based course URLs
 * Fetches the course by ID and redirects to the slug-based URL
 */
export const CourseIdRedirect = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToSlug = async () => {
      if (!id) {
        navigate('/discover');
        return;
      }

      try {
        // Fetch course by ID to get the slug
        const response = await fetch(`${serverURL}/api/course/id/${id}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.course && data.course.slug) {
            // Redirect to slug-based URL
            navigate(`/course/${data.course.slug}`, { replace: true });
          } else if (data.redirect) {
            // Handle redirect response
            const slugMatch = data.redirect.match(/\/course\/([^/]+)/);
            if (slugMatch && slugMatch[1]) {
              navigate(`/course/${slugMatch[1]}`, { replace: true });
            } else {
              navigate('/discover');
            }
          } else {
            navigate('/discover');
          }
        } else {
          navigate('/discover');
        }
      } catch (error) {
        console.error('Error redirecting to slug:', error);
        navigate('/discover');
      }
    };

    redirectToSlug();
  }, [id, navigate]);

  return <InlineLoader message="Loading course..." />;
};
