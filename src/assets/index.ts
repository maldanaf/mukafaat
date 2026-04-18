// Helper: Next.js/Turbopack imports images as { src, width, height } objects,
// but Vite imported them as plain URL strings. This normalizes both to strings.
const r = (asset: unknown): string =>
  typeof asset === "string"
    ? asset
    : asset && typeof asset === "object" && "src" in asset
      ? (asset as { src: string }).src
      : String(asset ?? "");

const Logo = "/assets/images/logo.png";
const LogoLight = "/assets/images/logo-light.png";
// Videos are referenced by path to avoid bundler issues
const MukafaatVideo = "/videos/event-masters.mp4";
const GetStartedVideo = "/videos/get-started.mp4";
const JobLocation = "/assets/images/job_location.svg";
const JobDate = "/assets/images/job_date.svg";
const JobPaymentAmoutn = "/assets/images/job_payment_amount.svg";
const JobType = "/assets/images/job_type.svg";
const JobDepartment = "/assets/images/job_department.svg";
const UploadUserPhoto = "/assets/images/upload-user-photo.svg";
const Loading = "/assets/images/loading.svg";
const userPlaceholder = "/assets/images/user.png";
const GooglePlay = "/assets/images/google-play.png";
const AppleStore = "/assets/images/apple-store.png";
const BusinessRegistrationLogo = "/assets/images/business-registration-logo.svg";
const SaudiFlag = "/assets/images/ar.png";
const enFlag = "/assets/images/en.png";
const LogoStart = "/assets/images/logo-start.png";
const GetStartedBg = "/assets/images/git-start-bg.png";
const AboutBg = "/assets/images/about-bg.jpg";
const BackService = "/assets/images/back-service.jpg";
const Splash = "/assets/images/splash.png";
// Investment images
const I1 = "/assets/images/i1.png";
const I2 = "/assets/images/i2.png";
const I3 = "/assets/images/i3.png";
const I4 = "/assets/images/i4.png";
const I5 = "/assets/images/i5.png";
const I6 = "/assets/images/i6.png";
const I7 = "/assets/images/i7.png";
const I8 = "/assets/images/i8.png";

// News images
const N1 = "/assets/images/n1.png";
const N2 = "/assets/images/n2.png";
const N3 = "/assets/images/n3.png";
const N4 = "/assets/images/n4.png";

const copon1 = "/assets/images/copon1.png";
const copon2 = "/assets/images/copon2.png";
const copon3 = "/assets/images/copon3.png";
const copon4 = "/assets/images/copon4.png";
const cutCopon = "/assets/images/cut-copon.png";

// Company images
const ManGroup = "/assets/images/man-group.png";
const ManrReal = "/assets/images/manr-real.png";
const AkaratCircle = "/assets/images/akarat-circle.png";

// Footer images
const MailboxIcon = "/assets/images/mail.png";

// FAQ images
const FAQImage = "/assets/images/faq.png";

// Owner image
const OwnerImage = "/assets/images/owner.png";

// Statistical card icons
const ClientIcon = "/assets/images/card-tick.png";
const ClientIcon2 = "/assets/images/client.png";
const EventsIcon = "/assets/images/events.png";
const CountriesIcon = "/assets/images/countries.png";
const FreelancersIcon = "/assets/images/freelancers.png";

// App images
const OurAppImage = "/assets/images/our-app.png";
const OurAppPattern = "/assets/images/our-app-pattern.png";
const OurAppPattern2 = "/assets/images/pattern.png";
const ProjectsPattern = "/assets/projects/paralex-project.png";
const PromoAppImage = "/assets/images/promo-app.png";
const WhyChooseUsImage = "/assets/images/why-chose-us.png";
// Portfolio images
const PortfolioEv1 = "/assets/portfolio/ev1.png";
const PortfolioEv2 = "/assets/portfolio/ev2.png";
const PortfolioEv3 = "/assets/portfolio/ev3.png";
const PortfolioEv4 = "/assets/portfolio/ev4.png";
const PatternNewProperty = "/assets/images/pattern-new-property.png";
const Pattern = "/assets/images/pattern.png";
// Worldwide Properties images
const WorldwidePropertiesImage = "/assets/images/worldwide.png";
const WorldwidePropertiesPattern = "/assets/images/pattern-wide.png";
const WorldwidePropertiesplaneVector = "/assets/images/plane-vector.png";

// WhyChooseUs feature icons
const PeopleIcon = "/assets/images/people.png";
const BriefcaseIcon = "/assets/images/briefcase.png";
const MouseSquareIcon = "/assets/images/mouse-square.png";
const SliderIcon = "/assets/images/slider.png";
const CubeIcon = "/assets/images/3dcube.png";

// About images
const AboutPattern = "/assets/images/about.png";
const MoroccoFlag = "/assets/images/maroco.png";
const SaudiRoundFlag = "/assets/images/soudi.png";
const EmiratesFlag = "/assets/images/emarates.png";
const BahrainFlag = "/assets/images/bh.png";
const OmanFlag = "/assets/images/oman.png";

const EnglishUK = "/assets/images/English-UK.png";
const EnglishUS = "/assets/images/English-US.png";
const UrduFlag = "/assets/images/urdo.jpg";
const HindiFlag = "/assets/images/india.png";
const Spanish = "/assets/images/Spanish.png";
const Francais = "/assets/images/Francais.png";
const Nederlands = "/assets/images/Nederlands.png";

// Gallery images
const G1 = "/assets/gallary/g1.jpeg";
const G2 = "/assets/gallary/g2.jpeg";
const G3 = "/assets/gallary/g3.jpeg";
const G4 = "/assets/gallary/g4.jpeg";
const G5 = "/assets/gallary/g5.jpeg";
const G6 = "/assets/gallary/g6.jpeg";
const G7 = "/assets/gallary/g7.jpeg";
const G8 = "/assets/gallary/g8.jpeg";
const G9 = "/assets/gallary/g9.jpeg";
const G10 = "/assets/gallary/g10.jpeg";
const G11 = "/assets/gallary/g11.jpeg";
const G12 = "/assets/gallary/g12.jpeg";
const G13 = "/assets/gallary/g13.jpeg";
const G14 = "/assets/gallary/g14.png";
const G15 = "/assets/gallary/g15.png";
const G16 = "/assets/gallary/g16.png";
const G17 = "/assets/gallary/g17.png";
const G18 = "/assets/gallary/g18.png";

// Slider images
const Slider1 = "/assets/slider/sr1.png";
const Slider2 = "/assets/slider/sr2.png";
const Slider3 = "/assets/slider/sr3.png";
const Slider4 = "/assets/slider/sr4.png";
const Slider5 = "/assets/slider/sr5.png";
const Slider6 = "/assets/slider/sr6.png";
const SliderBg = "/assets/slider/bg.png";

const Banner = "/assets/slider/banner.png";
const Banner2 = "/assets/slider/banner11.png";
const Banner22 = "/assets/slider/banner22.jpg";
const Banner33 = "/assets/slider/banner33.png";
const Slide2 = "/assets/slider/slide2.png";
const S3 = "/assets/slider/02.png";
const S4 = "/assets/slider/04.png";
const S5 = "/assets/slider/s5.png";
const S6 = "/assets/slider/s6.png";
const S21 = "/assets/slider/03.png";
const SliderStat1 = "/assets/slider/2.png";
const SliderStat2 = "/assets/slider/3.png";

const t1 = "/assets/slider/t1.png";
const t2 = "/assets/slider/t2.png";
const t3 = "/assets/slider/t3.png";
const t4 = "/assets/slider/t4.png";
const t5 = "/assets/slider/t5.png";
const t6 = "/assets/slider/t6.png";
const comma = "/assets/images/vector.png";
const ContactIcon = "/assets/images/contact-icon.png";
const PatternContact = "/assets/images/pattern-contact.png";
// Partners logos
const Partner1 = "/assets/partners/p1.png";
const Partner2 = "/assets/partners/p2.png";
const Partner3 = "/assets/partners/p3.png";
const Partner4 = "/assets/partners/p4.png";
const Partner5 = "/assets/partners/p5.png";

// Testimonials images
const User1 = "/assets/images/user1.png";
const User2 = "/assets/images/user2.png";
const PropertyIcon = "/assets/property/property-icon.png";
const UnderTitle = "/assets/images/upder-title.png";
const Layer = "/assets/images/layer.png";
const Pubular = "/assets/images/pubular.png";
const NewOffers = "/assets/images/new-offers.png";
const TurkyFlag = "/assets/images/turky.png";
const PrivacyImage = "/assets/images/privacy.jpg";

// Category icons
const CarIcon = "/assets/category/car.png";
const CoffeeIcon = "/assets/category/coffee.png";
const DeliveryIcon = "/assets/category/delivery.png";
const GameIcon = "/assets/category/game.png";
const HeadphoneIcon = "/assets/category/headphone.png";
const HotelIcon = "/assets/category/hotel.png";
const RestaurantIcon = "/assets/category/reseturant.png";
const ShopIcon = "/assets/category/shop.png";
const BackDev = "/assets/category/backdev.png";

// Product images
const Pro1 = "/assets/category/pro1.png";
const Pro2 = "/assets/category/pro2.png";
const Pro3 = "/assets/category/pro3.png";
const Pro4 = "/assets/category/pro4.png";
const Pro5 = "/assets/category/pro5.png";
const Pro6 = "/assets/category/pro6.png";
const Pro7 = "/assets/category/pro7.png";
const Pro8 = "/assets/category/pro8.png";

// New product images
const New1 = "/assets/images/new1.png";
const New2 = "/assets/images/new2.png";
const New3 = "/assets/images/new3.png";
const New4 = "/assets/images/new4.png";

// Service images
const A1 = "/assets/images/a1.png";
const A2 = "/assets/images/a2.png";
const A3 = "/assets/images/a3.png";

// Cards images
const Cards1 = "/assets/images/cards1.png";
const Cards2 = "/assets/images/cards2.png";
const Cards3 = "/assets/images/carda3.png";
const Cards4 = "/assets/images/cards4.png";
const Cards5 = "/assets/images/cards5.png";
const Cards6 = "/assets/images/cards6.png";
const Cards7 = "/assets/images/cards7.png";
const Cards8 = "/assets/images/cards8.png";
const Cards11 = "/assets/images/cards11.png";
const Cards12 = "/assets/images/card12.jpg";
const Cards13 = "/assets/images/card13.jpg";
const Cards14 = "/assets/images/card14.jpg";
const Cardpayment = "/assets/images/cardpayment.png";
// Restaurant images
const Restu1 = "/assets/images/restu1.png";
const Restu2 = "/assets/images/restu2.png";
const Restu3 = "/assets/images/restu3.png";

// Payment method images
const Visa = "/assets/images/visa.png";
const Master = "/assets/images/master.png";
const ApplePay = "/assets/images/aplpay.png";
const Mada = "/assets/images/mda.png";
const Wallet = "/assets/images/w1.png";
const WalletIcon = "/assets/images/walet.png";
const Soudi = "/assets/images/soudi.png";
export {
  Logo,
  LogoLight,
  MukafaatVideo,
  GetStartedVideo,
  JobLocation,
  JobDate,
  JobPaymentAmoutn,
  JobType,
  JobDepartment,
  UploadUserPhoto,
  Loading,
  userPlaceholder,
  GooglePlay,
  AppleStore,
  BusinessRegistrationLogo,
  SaudiFlag,
  enFlag,
  LogoStart,
  GetStartedBg,
  AboutBg,
  BackService,
  Splash,
  // Investment images
  I1,
  I2,
  I3,
  I4,
  I5,
  I6,
  I7,
  I8,
  // News images
  N1,
  N2,
  N3,
  N4,
  // Statistical card icons
  ClientIcon,
  ClientIcon2,
  EventsIcon,
  CountriesIcon,
  FreelancersIcon,
  // App images
  OurAppImage,
  OurAppPattern,
  OurAppPattern2,
  ProjectsPattern,
  PromoAppImage,
  WhyChooseUsImage,
  // Portfolio images
  PortfolioEv1,
  PortfolioEv2,
  PortfolioEv3,
  PortfolioEv4,
  // WhyChooseUs feature icons
  PeopleIcon,
  BriefcaseIcon,
  MouseSquareIcon,
  SliderIcon,
  CubeIcon,
  // About images
  AboutPattern,
  MoroccoFlag,
  SaudiRoundFlag,
  EmiratesFlag,
  BahrainFlag,
  OmanFlag,
  EnglishUK,
  EnglishUS,
  UrduFlag,
  HindiFlag,
  Spanish,
  Francais,
  Nederlands,
  PropertyIcon,
  UnderTitle,
  Layer,
  // Gallery images
  G1,
  G2,
  G3,
  G4,
  G5,
  G6,
  G7,
  G8,
  G9,
  G10,
  G11,
  G12,
  G13,
  G14,
  G15,
  G16,
  G17,
  G18,
  // Slider exports
  Slider1,
  Slider2,
  Slider3,
  Slider4,
  Slider5,
  Slider6,
  SliderBg,
  Slide2,
  S3,
  S4,
  S5,
  S6,
  S21,
  SliderStat1,
  SliderStat2,
  t1,
  t2,
  t3,
  t4,
  t5,
  t6,
  comma,
  ContactIcon,
  PatternContact,
  Partner1,
  Partner2,
  Partner3,
  Partner4,
  Partner5,
  User1,
  User2,
  Banner,
  Banner2,
  Banner22,
  Banner33,
  WorldwidePropertiesImage,
  WorldwidePropertiesPattern,
  WorldwidePropertiesplaneVector,
  PatternNewProperty,
  Pattern,
  Pubular,
  NewOffers,
  TurkyFlag,
  PrivacyImage,
  ManGroup,
  ManrReal,
  AkaratCircle,
  MailboxIcon,
  FAQImage,
  OwnerImage,
  // Category icons
  CarIcon,
  CoffeeIcon,
  DeliveryIcon,
  GameIcon,
  HeadphoneIcon,
  HotelIcon,
  RestaurantIcon,
  ShopIcon,
  BackDev,
  // Product images
  Pro1,
  Pro2,
  Pro3,
  Pro4,
  Pro5,
  Pro6,
  Pro7,
  Pro8,
  // New product images
  New1,
  New2,
  New3,
  New4,
  // Service images
  A1,
  A2,
  A3,
  // Cards images
  Cards1,
  Cards2,
  Cards3,
  Cards4,
  Cards5,
  Cards6,
  Cards7,
  Cards8,
  Cards11,
  Cards12,
  Cards13,
  Cards14,
  Cardpayment,
  // Restaurant images
  Restu1,
  Restu2,
  Restu3,
  // Payment method images
  Visa,
  Master,
  ApplePay,
  Mada,
  Wallet,
  WalletIcon,
  copon1,
  copon2,
  copon3,
  copon4,
  cutCopon,
  Soudi,
};
