import React, { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Download, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';
import certificate from '../res/certificate.png';
import logo from '../res/logo.svg';
import { toPng } from 'html-to-image';
import { appName } from '@/constants';

const Certificate = () => {

  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const userName = sessionStorage.getItem('mName');
  const { state } = useLocation();
  const { courseTitle, end } = state || {};

  const pdfRef = useRef(null);

  const handleDownload = async () => {
    setProcessing(true);
    toPng(pdfRef.current, { cacheBust: false })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "certificate.png";
        link.href = dataUrl;
        link.click();
        toast({
          title: "Certificate Downloaded",
          description: "Your certificate has been downloaded successfully.",
        });
        setProcessing(false);
      })
      .catch((err) => {
        //DO NOTHING
        setProcessing(false);
      });
  };

  function isValidFormat(dateString) {
    // Regex to check if date is in D/M/YYYY format (DD/MM/YYYY)
    const regex = /^([0-2]?[0-9]|3[01])\/([1-9]|1[0-2])\/\d{4}$/;
    return regex.test(dateString);
  }

  function formatDateToMDYY(dateString) {
    // Parse the ISO date string directly into a Date object
    const dateObj = new Date(dateString);

    // Handle invalid date scenarios
    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date");
    }

    // Format the date to M/D/YY (using local date components)
    const monthFormatted = dateObj.getMonth() + 1; // Months are 0-indexed
    const dayFormatted = dateObj.getDate();
    const yearFormatted = dateObj.getFullYear().toString().slice(-2); // Last two digits

    return `${monthFormatted}/${dayFormatted}/${yearFormatted}`;
  }
  
  function checkAndFormatDate(dateString) {
    console.log(dateString);
    if (isValidFormat(dateString)) {
      return formatDateToMDYY(dateString); // Convert DD/MM/YYYY to M/D/YY
    } else {
      // Assume input is in ISO 8601 format if not already valid
      return formatDateToMDYY(dateString);
    }
  }


  return (
    <>
      <SEO
        title={`${courseTitle} Course Certificate`}
        description={`Congratulations on completing the ${courseTitle} course. Download your certificate of completion.`}
        keywords={`certificate, ${courseTitle}, course completion, online learning, achievement`}
      />
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardContent className="p-0">
            <div className="text-center p-8 border-b relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 z-0"></div>
              <Award className="h-16 w-16 mx-auto text-primary mb-4 relative z-10" />
              <h2 className="text-3xl font-bold mb-2 relative z-10">Congratulations!</h2>
              <p className="text-muted-foreground relative z-1 capitalize">
                You've successfully completed the {courseTitle} course.
              </p>
            </div>

            <div className={cn(
              "border-8 border-muted m-6 relative",
              "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]",
              "from-background via-background/95 to-background/90",
              "h-full"
            )}>
              <div className='w-full'>
                <div ref={pdfRef}>
                  <img src={certificate} className="w-full h-full" alt="logo" />
                  <p className='absolute text-3xl font-black italic max-lg:text-2xl max-md:text-lg' style={{ top: '47%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    {sessionStorage.getItem('mName')}
                  </p>
                  <p className='absolute text-xs font-medium max-md:text-[8px]' style={{ color: '#0f4bac', top: '63.5%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    on {checkAndFormatDate(end)}
                  </p>
                  <div className='absolute' style={{ top: '59%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <p className='text-base font-bold capitalize max-md:text-[8px]'>
                      {courseTitle}
                    </p>
                  </div>
                  <div className='absolute rounded-md bg-primary max-lg:h-7 max-lg:w-7 h-10 w-10 flex items-center justify-center' style={{ top: '83%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <img className='h-6 w-6 max-lg:h-4 max-lg:w-4' src={logo} />
                  </div>
                  <p style={{ top: '92%', left: '50%', transform: 'translate(-50%, -50%)' }} className='absolute text-xs justify-center self-center text-center font-semibold max-lg:text-xs max-md:text-[8px]'>
                    {appName}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>

              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                {processing ? 'Downloading...' : 'Download Certificate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Certificate;
