import makeinindia from '../assets/makeinindia.png';
import support from '../assets/support.png';
import caseon from '../assets/case.png';
import free from '../assets/free.png';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <div className="w-full h-full bg-white mt-10">
      {/* Icons Section with hover and divider */}
      <div className="flex justify-between items-center bg-[rgb(212,210,211)] w-full mb-8 px-2 sm:px-4 md:px-8 h-[120px] sm:h-[140px] md:h-[150px]">
          {[makeinindia, support, caseon, free].map((img, index) => (
            <div
              key={index}
              className="flex flex-1 justify-center items-center relative group"
            >
              <img
                src={img}
                alt="icon"
                className="w-16 sm:w-20 cursor-pointer md:w-42 transform transition-transform duration-300 group-hover:scale-110"
              />
              {index !== 3 && (
                <div className="hidden md:block absolute right-0 top-3 h-16 w-[2px] bg-gray-600" />
              )}
            </div>
          ))}
        </div>
      {/* Address & Contact Section */}
      <div className="w-full flex flex-col bg-[rgb(212,210,211)] md:flex-row justify-between gap-10 px-10 py-5 text-sm md:text-base">
        {/* Left: Logo + Address */}
        <div className="flex flex-col gap-3 md:w-1/2">
          <img src={logo} alt="Logo" className="w-28 md:w-36" />
          <div> 
            <h3 className="font-semibold mb-1">Our Address:</h3>
            <p>PLOT NO:24, ARUNACHALLA AVENUE, PARANIPUTHUR</p>
            <p>MAIN ROAD, IYYAPANTHANGAL, CHENNAI - 600 122.</p>
          </div>
        </div>

        {/* Right: Contact + Social */}
        <div className="flex flex-col gap-3 md:w-1/2">
          <h3 className="font-semibold">Contact:</h3>
          <p>CUSTOMER CARE: <strong>936-058-7969</strong> (10AM TO 6PM)</p>

          <h3 className="font-semibold mt-2">Social Link:</h3>
          <div className="flex gap-4 items-center">
            <a href="#"><img src="https://img.icons8.com/fluency/24/gmail.png" alt="Gmail" /></a>
            <a href="#"><img src="https://img.icons8.com/fluency/24/facebook-new.png" alt="Facebook" /></a>
            <a href="#"><img src="https://img.icons8.com/fluency/24/youtube-play.png" alt="YouTube" /></a>
            <a href="#"><img src="https://img.icons8.com/fluency/24/instagram-new.png" alt="Instagram" /></a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
