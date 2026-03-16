--
-- PostgreSQL database dump
--

\restrict URqUjgWDFR7q3BlbkePW2fNh5LHKARhS6K4XjSExlh08gpyUVif2yHN06vC3Zmf

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activities (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    customer_id integer,
    opportunity_id integer,
    user_id integer,
    scheduled_at timestamp without time zone,
    completed_at timestamp without time zone,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT activities_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT activities_type_check CHECK (((type)::text = ANY ((ARRAY['call'::character varying, 'meeting'::character varying, 'email'::character varying, 'note'::character varying, 'task'::character varying, 'visit'::character varying])::text[])))
);


ALTER TABLE public.activities OWNER TO postgres;

--
-- Name: activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activities_id_seq OWNER TO postgres;

--
-- Name: activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activities_id_seq OWNED BY public.activities.id;


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50),
    status character varying(50) DEFAULT 'draft'::character varying,
    budget numeric(15,2) DEFAULT 0,
    start_date date,
    end_date date,
    description text,
    target_audience text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT campaigns_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'paused'::character varying, 'completed'::character varying])::text[]))),
    CONSTRAINT campaigns_type_check CHECK (((type)::text = ANY ((ARRAY['email'::character varying, 'social'::character varying, 'event'::character varying, 'promotion'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.campaigns OWNER TO postgres;

--
-- Name: campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaigns_id_seq OWNER TO postgres;

--
-- Name: campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    customer_id integer,
    name character varying(255) NOT NULL,
    "position" character varying(100),
    phone character varying(100),
    email character varying(255),
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contacts_id_seq OWNER TO postgres;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    company character varying(255),
    email character varying(255),
    phone character varying(100),
    address text,
    city character varying(100),
    province character varying(100),
    postal_code character varying(20),
    latitude double precision,
    longitude double precision,
    category character varying(50) DEFAULT 'prospect'::character varying,
    notes text,
    assigned_to integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    customer_code character varying(100),
    lead_id integer,
    CONSTRAINT customers_category_check CHECK (((category)::text = ANY ((ARRAY['prospect'::character varying, 'active'::character varying, 'inactive'::character varying, 'vip'::character varying])::text[])))
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(100),
    company character varying(255),
    source character varying(100),
    score integer DEFAULT 0,
    status character varying(50) DEFAULT 'new'::character varying,
    campaign_id integer,
    assigned_to integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    lead_code character varying(50),
    CONSTRAINT leads_score_check CHECK (((score >= 0) AND (score <= 100))),
    CONSTRAINT leads_source_check CHECK (((source)::text = ANY ((ARRAY['website'::character varying, 'referral'::character varying, 'social_media'::character varying, 'campaign'::character varying, 'cold_call'::character varying, 'event'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT leads_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'contacted'::character varying, 'qualified'::character varying, 'converted'::character varying, 'lost'::character varying])::text[])))
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_id_seq OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opportunities (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    customer_id integer,
    stage_id integer,
    value numeric(15,2) DEFAULT 0,
    probability integer DEFAULT 50,
    expected_close date,
    assigned_to integer,
    description text,
    status character varying(50) DEFAULT 'open'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT opportunities_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
    CONSTRAINT opportunities_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'won'::character varying, 'lost'::character varying])::text[])))
);


ALTER TABLE public.opportunities OWNER TO postgres;

--
-- Name: opportunities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opportunities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opportunities_id_seq OWNER TO postgres;

--
-- Name: opportunities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opportunities_id_seq OWNED BY public.opportunities.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    product_name character varying(255),
    quantity integer DEFAULT 1,
    price numeric(15,2) DEFAULT 0,
    discount numeric(15,2) DEFAULT 0,
    total numeric(15,2) DEFAULT 0
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_id integer,
    user_id integer,
    status character varying(50) DEFAULT 'draft'::character varying,
    subtotal numeric(15,2) DEFAULT 0,
    discount numeric(15,2) DEFAULT 0,
    tax numeric(15,2) DEFAULT 0,
    total numeric(15,2) DEFAULT 0,
    notes text,
    approved_by integer,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'processing'::character varying, 'shipped'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: pipeline_stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pipeline_stages (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    color character varying(20) DEFAULT '#3b82f6'::character varying,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true
);


ALTER TABLE public.pipeline_stages OWNER TO postgres;

--
-- Name: pipeline_stages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pipeline_stages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pipeline_stages_id_seq OWNER TO postgres;

--
-- Name: pipeline_stages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pipeline_stages_id_seq OWNED BY public.pipeline_stages.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_categories OWNER TO postgres;

--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_categories_id_seq OWNER TO postgres;

--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    sku character varying(100),
    description text,
    price numeric(15,2) DEFAULT 0,
    unit character varying(50) DEFAULT 'pcs'::character varying,
    category character varying(100),
    stock integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    product_code character varying(100),
    sub_category character varying(100),
    brand character varying(100),
    model character varying(100),
    category_2 character varying(100),
    category_3 character varying(100)
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    key character varying(100) NOT NULL,
    value text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: user_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_locations (
    id integer NOT NULL,
    user_id integer,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    accuracy double precision,
    speed double precision,
    heading double precision,
    recorded_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_locations OWNER TO postgres;

--
-- Name: user_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_locations_id_seq OWNER TO postgres;

--
-- Name: user_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_locations_id_seq OWNED BY public.user_locations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'sales'::character varying,
    phone character varying(50),
    avatar character varying(500),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'sales'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id integer NOT NULL,
    customer_id integer,
    user_id integer,
    checkin_time timestamp without time zone DEFAULT now() NOT NULL,
    checkout_time timestamp without time zone,
    checkin_lat double precision,
    checkin_lng double precision,
    checkout_lat double precision,
    checkout_lng double precision,
    checkin_address text,
    checkout_address text,
    checkin_photo character varying(500),
    notes text,
    summary text,
    status character varying(50) DEFAULT 'checked_in'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT visits_status_check CHECK (((status)::text = ANY ((ARRAY['checked_in'::character varying, 'checked_out'::character varying])::text[])))
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- Name: visits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visits_id_seq OWNER TO postgres;

--
-- Name: visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visits_id_seq OWNED BY public.visits.id;


--
-- Name: activities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities ALTER COLUMN id SET DEFAULT nextval('public.activities_id_seq'::regclass);


--
-- Name: campaigns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: opportunities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities ALTER COLUMN id SET DEFAULT nextval('public.opportunities_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: pipeline_stages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_stages ALTER COLUMN id SET DEFAULT nextval('public.pipeline_stages_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: user_locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_locations ALTER COLUMN id SET DEFAULT nextval('public.user_locations_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: visits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits ALTER COLUMN id SET DEFAULT nextval('public.visits_id_seq'::regclass);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activities (id, type, title, description, customer_id, opportunity_id, user_id, scheduled_at, completed_at, status, created_at) FROM stdin;
17	email	penawaran	au ah gelap	4	\N	5	2026-03-11 16:56:00	2026-03-11 16:57:05.465675	completed	2026-03-11 16:57:05.465675
18	visit	Check-in di lokasi pelanggan	\N	7	\N	1	\N	2026-03-12 14:19:01.950708	completed	2026-03-12 14:19:01.950708
19	visit	Check-in di -6.140088, 106.777791	\N	7	\N	1	\N	2026-03-12 14:25:23.540136	completed	2026-03-12 14:25:23.540136
20	visit	Check-in di lokasi pelanggan	\N	7	\N	1	\N	2026-03-12 15:46:17.558957	completed	2026-03-12 15:46:17.558957
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campaigns (id, name, type, status, budget, start_date, end_date, description, target_audience, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, customer_id, name, "position", phone, email, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, company, email, phone, address, city, province, postal_code, latitude, longitude, category, notes, assigned_to, created_by, created_at, updated_at, customer_code, lead_id) FROM stdin;
3	Grirya asri	distibutor plywood	\N	08111583803	\N	\N	\N	\N	-6.140078	106.777797	prospect	\N	5	5	2026-03-04 17:11:49.24055	2026-03-04 17:11:49.24055	\N	\N
4	Astori	Kontraktor		2131124143					-6.140076	106.777795	prospect		\N	5	2026-03-04 17:46:34.355677	2026-03-04 17:59:59.358771	\N	\N
7	Sumber Arta	kontraktor	lila@sumber.com	0812223455					-6.140071	106.777796	prospect		1	5	2026-03-12 11:39:51.771938	2026-03-12 11:40:33.727665	LD-0001	1
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, name, email, phone, company, source, score, status, campaign_id, assigned_to, notes, created_at, updated_at, lead_code) FROM stdin;
1	Sumber Arta	lila@sumber.com	0812223455	kontraktor	social_media	0	new	\N	5	\N	2026-03-11 17:32:17.665144	2026-03-11 17:32:17.665144	LD-0001
\.


--
-- Data for Name: opportunities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opportunities (id, title, customer_id, stage_id, value, probability, expected_close, assigned_to, description, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, product_name, quantity, price, discount, total) FROM stdin;
2	2	13	Laptop 2	1	4500000.00	0.00	4500000.00
3	3	11	Mouse	2	50000.00	100.00	99900.00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, customer_id, user_id, status, subtotal, discount, tax, total, notes, approved_by, approved_at, created_at, updated_at) FROM stdin;
2	ORD-202603-0001	7	5	completed	4500000.00	0.00	495000.00	4995000.00	\N	5	2026-03-14 14:21:30.69064	2026-03-14 14:21:25.524863	2026-03-14 14:28:57.828472
3	ORD-202603-0002	3	5	pending	99900.00	0.00	10989.00	110889.00	\N	\N	\N	2026-03-14 14:32:13.285976	2026-03-14 14:32:13.285976
\.


--
-- Data for Name: pipeline_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pipeline_stages (id, name, color, sort_order, is_active) FROM stdin;
1	Prospek Baru	#6366f1	1	t
3	Proposal	#3b82f6	2	t
4	Negosiasi	#f97316	3	t
5	Closing	#10b981	4	t
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_categories (id, name, type, is_active, created_at) FROM stdin;
2	Alat Bantu	Category 2	f	2026-03-12 13:14:06.525482
1	Komputer	Category 1	f	2026-03-12 13:13:53.453907
3	-	Category	t	2026-03-12 13:17:47.398062
4	-	Type	t	2026-03-12 13:17:53.580029
5	-	Brand	t	2026-03-12 13:18:00.681282
6	-	Model	t	2026-03-12 13:18:06.113768
7	Komputer	Category	t	2026-03-12 13:18:14.120049
8	Tolls	Category	t	2026-03-12 13:18:34.772817
9	Laptop	Category	t	2026-03-12 13:19:03.378483
10	Destop	Type	t	2026-03-12 13:19:14.605317
11	Mini PC	Type	t	2026-03-12 13:19:23.358302
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, sku, description, price, unit, category, stock, is_active, created_at, updated_at, product_code, sub_category, brand, model, category_2, category_3) FROM stdin;
1	Produk A	SKU001	\N	100000.00	pcs	\N	50	f	2026-03-03 13:30:50.03533	2026-03-03 13:30:50.03533	\N	\N	\N	\N	\N	\N
7	Test Auto PR002	\N	\N	0.00	pcs	\N	0	f	2026-03-05 13:33:28.887894	2026-03-05 13:33:28.887894	PR002	\N	\N	\N	\N	\N
8	Test Auto PR003	\N	\N	0.00	pcs	\N	0	f	2026-03-05 13:34:14.512676	2026-03-05 13:34:14.512676	PR003	\N	\N	\N	\N	\N
3	Server 	\N	Komputer Server	0.00	pcs	\N	0	f	2026-03-05 13:17:31.172819	2026-03-05 13:17:31.172819	\N	\N	\N	\N	\N	\N
2	Produk Test ID			0.00	pcs		0	f	2026-03-05 11:53:49.478931	2026-03-05 11:54:29.129619	PRD-002	\N	\N	\N	\N	\N
4	Produk Auto ID 1	\N	\N	0.00	pcs	\N	0	f	2026-03-05 13:20:40.722736	2026-03-05 13:20:40.722736	PR001	\N	\N	\N	\N	\N
9	Server	\N	Komputer Server	0.00	pcs	Komputer	0	f	2026-03-05 13:37:09.075002	2026-03-05 13:37:09.075002	PR004	\N	\N	\N	\N	\N
13	Laptop 2	\N	\N	0.00	pcs	Laptop	0	t	2026-03-12 14:09:29.053892	2026-03-12 14:09:29.053892	PR008	\N	-	-	-	\N
11	Mouse	\N	\N	0.00	pcs	Tolls	0	t	2026-03-12 11:50:35.703168	2026-03-12 14:15:15.72954	PR006	\N	-	-	-	\N
10	PC Komputer	\N	\N	0.00	pcs	Komputer	0	t	2026-03-12 11:50:18.908334	2026-03-12 14:15:24.000057	PR005	\N	-	-	-	\N
12	Laptop	\N	\N	0.00	pcs	Laptop	0	t	2026-03-12 11:50:45.629262	2026-03-12 14:15:39.069949	PR007	\N	-	-	-	\N
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value, updated_at) FROM stdin;
app_logo	data:image/png;base64,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	2026-03-05 10:28:00.573706
smtp_host	smtp.hostinger.com	2026-03-11 15:03:59.572825
smtp_user	wisnu@ikalus-167jkt.com	2026-03-11 15:03:59.658928
smtp_pass	Ikalus2025*#	2026-03-11 15:03:59.661147
smtp_port	465	2026-03-11 15:03:59.675408
smtp_from	wisnu@ikalus-167jkt.com	2026-03-11 15:03:59.70302
\.


--
-- Data for Name: user_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_locations (id, user_id, latitude, longitude, accuracy, speed, heading, recorded_at, created_at) FROM stdin;
2	1	-6.208088087170634	107.01078356234014	87	\N	\N	2026-03-04 22:47:18.114527	2026-03-04 22:47:18.114527
3	1	-6.208088087170634	107.01078356234014	87	\N	\N	2026-03-04 22:47:26.443212	2026-03-04 22:47:26.443212
4	1	-6.208079467812592	107.01074739180373	84	\N	\N	2026-03-04 22:47:36.832856	2026-03-04 22:47:36.832856
5	1	-6.208079467812592	107.01074739180373	84	\N	\N	2026-03-04 22:47:46.8348	2026-03-04 22:47:46.8348
6	1	-6.208079467812592	107.01074739180373	84	\N	\N	2026-03-04 22:47:56.818694	2026-03-04 22:47:56.818694
7	1	-6.208079467812592	107.01074739180373	84	\N	\N	2026-03-04 22:48:06.822147	2026-03-04 22:48:06.822147
8	1	-6.208079467812592	107.01074739180373	84	\N	\N	2026-03-04 22:48:16.809711	2026-03-04 22:48:16.809711
9	1	-6.208079467812592	107.01074739180373	84	\N	\N	2026-03-04 22:48:26.811901	2026-03-04 22:48:26.811901
10	1	-6.208079467812592	107.01074739180373	84	\N	\N	2026-03-04 22:49:01.955349	2026-03-04 22:49:01.955349
1	1	-6.208088087170634	107.01078356234014	87	\N	\N	2026-03-04 22:47:18.113811	2026-03-04 22:47:18.113811
12	1	-6.208094018057571	107.01053563110447	100	\N	\N	2026-03-04 22:50:29.807869	2026-03-04 22:50:29.807869
11	1	-6.208094018057571	107.01053563110447	100	\N	\N	2026-03-04 22:50:29.807003	2026-03-04 22:50:29.807003
13	1	-6.208094018057571	107.01053563110447	100	\N	\N	2026-03-04 22:50:38.837641	2026-03-04 22:50:38.837641
14	1	-6.208094018057571	107.01053563110447	100	\N	\N	2026-03-04 22:50:48.811691	2026-03-04 22:50:48.811691
15	1	-6.208094018057571	107.01053563110447	100	\N	\N	2026-03-04 22:50:58.822558	2026-03-04 22:50:58.822558
16	1	-6.208094018057571	107.01053563110447	100	\N	\N	2026-03-04 22:51:08.801445	2026-03-04 22:51:08.801445
17	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 22:52:56.777293	2026-03-04 22:52:56.777293
18	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 22:52:56.780249	2026-03-04 22:52:56.780249
19	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 22:53:05.249621	2026-03-04 22:53:05.249621
20	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 22:53:15.249216	2026-03-04 22:53:15.249216
21	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 22:53:25.229798	2026-03-04 22:53:25.229798
22	1	-6.208092888440367	107.01053871009174	134	\N	\N	2026-03-04 22:53:35.226082	2026-03-04 22:53:35.226082
23	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:53:45.253553	2026-03-04 22:53:45.253553
24	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:53:55.251209	2026-03-04 22:53:55.251209
25	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:54:05.24797	2026-03-04 22:54:05.24797
26	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:54:15.231344	2026-03-04 22:54:15.231344
27	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:54:25.238603	2026-03-04 22:54:25.238603
28	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 22:54:35.238347	2026-03-04 22:54:35.238347
29	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 22:54:45.23356	2026-03-04 22:54:45.23356
30	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 22:54:55.225532	2026-03-04 22:54:55.225532
31	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 22:55:05.239742	2026-03-04 22:55:05.239742
32	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 22:55:15.242741	2026-03-04 22:55:15.242741
33	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 22:55:25.252499	2026-03-04 22:55:25.252499
34	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:55:35.248738	2026-03-04 22:55:35.248738
35	1	-6.208094018057571	107.01053563110447	100	\N	\N	2026-03-04 22:55:45.234515	2026-03-04 22:55:45.234515
36	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:55:55.241848	2026-03-04 22:55:55.241848
37	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:56:05.239268	2026-03-04 22:56:05.239268
38	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 22:56:15.232758	2026-03-04 22:56:15.232758
39	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 22:56:25.216186	2026-03-04 22:56:25.216186
40	1	-6.208094253113286	107.01067860402166	81	\N	\N	2026-03-04 22:56:35.224172	2026-03-04 22:56:35.224172
41	1	-6.208100644377279	107.01069220477257	79	\N	\N	2026-03-04 22:56:45.226201	2026-03-04 22:56:45.226201
42	1	-6.208100644377279	107.01069220477257	79	\N	\N	2026-03-04 22:56:55.217697	2026-03-04 22:56:55.217697
43	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 22:57:05.282277	2026-03-04 22:57:05.282277
44	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 22:57:15.236826	2026-03-04 22:57:15.236826
45	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 22:57:25.229754	2026-03-04 22:57:25.229754
46	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 22:57:35.239333	2026-03-04 22:57:35.239333
47	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:57:45.217819	2026-03-04 22:57:45.217819
48	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:57:55.269415	2026-03-04 22:57:55.269415
49	1	-6.208094018057571	107.01053563110447	100	\N	\N	2026-03-04 22:58:05.227436	2026-03-04 22:58:05.227436
50	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 22:58:15.225841	2026-03-04 22:58:15.225841
51	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 22:58:25.211307	2026-03-04 22:58:25.211307
52	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 22:58:35.38141	2026-03-04 22:58:35.38141
53	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 22:58:45.237854	2026-03-04 22:58:45.237854
54	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 22:58:55.234594	2026-03-04 22:58:55.234594
55	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 22:59:05.231641	2026-03-04 22:59:05.231641
56	1	-6.208148525987526	107.01056651991045	96	\N	\N	2026-03-04 22:59:15.224418	2026-03-04 22:59:15.224418
57	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 22:59:25.225761	2026-03-04 22:59:25.225761
58	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:59:35.278415	2026-03-04 22:59:35.278415
59	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:59:45.23354	2026-03-04 22:59:45.23354
60	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 22:59:55.232272	2026-03-04 22:59:55.232272
61	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:00:05.225053	2026-03-04 23:00:05.225053
62	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:00:15.227416	2026-03-04 23:00:15.227416
63	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:00:25.282516	2026-03-04 23:00:25.282516
64	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:00:35.233294	2026-03-04 23:00:35.233294
65	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:00:45.232337	2026-03-04 23:00:45.232337
66	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:00:55.225105	2026-03-04 23:00:55.225105
67	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:01:05.225341	2026-03-04 23:01:05.225341
68	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:01:15.241033	2026-03-04 23:01:15.241033
69	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:01:25.23668	2026-03-04 23:01:25.23668
70	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:01:35.232075	2026-03-04 23:01:35.232075
71	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:01:45.227189	2026-03-04 23:01:45.227189
72	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:01:55.235092	2026-03-04 23:01:55.235092
73	1	-6.208094253113286	107.01067860402166	81	\N	\N	2026-03-04 23:02:05.236147	2026-03-04 23:02:05.236147
74	1	-6.208094253113286	107.01067860402166	81	\N	\N	2026-03-04 23:02:15.23807	2026-03-04 23:02:15.23807
75	1	-6.208098490131587	107.01055845240059	91	\N	\N	2026-03-04 23:02:25.23203	2026-03-04 23:02:25.23203
76	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 23:02:35.230138	2026-03-04 23:02:35.230138
77	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:02:45.240975	2026-03-04 23:02:45.240975
78	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:02:55.23942	2026-03-04 23:02:55.23942
79	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:03:05.234122	2026-03-04 23:03:05.234122
80	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:03:15.242167	2026-03-04 23:03:15.242167
81	1	-6.2080718826603665	107.01068275546633	81	\N	\N	2026-03-04 23:03:25.238975	2026-03-04 23:03:25.238975
82	1	-6.208094253113286	107.01067860402166	81	\N	\N	2026-03-04 23:03:35.250058	2026-03-04 23:03:35.250058
83	1	-6.208094253113286	107.01067860402166	81	\N	\N	2026-03-04 23:03:45.250361	2026-03-04 23:03:45.250361
84	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 23:03:55.233676	2026-03-04 23:03:55.233676
85	1	-6.208148525987526	107.01056651991045	96	\N	\N	2026-03-04 23:04:05.244801	2026-03-04 23:04:05.244801
86	1	-6.208148525987526	107.01056651991045	96	\N	\N	2026-03-04 23:04:15.239819	2026-03-04 23:04:15.239819
87	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 23:04:25.233356	2026-03-04 23:04:25.233356
88	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:04:35.247512	2026-03-04 23:04:35.247512
89	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:04:45.246539	2026-03-04 23:04:45.246539
90	1	-6.2080718826603665	107.01068275546633	81	\N	\N	2026-03-04 23:04:55.244101	2026-03-04 23:04:55.244101
91	1	-6.208098490131587	107.01055845240059	91	\N	\N	2026-03-04 23:05:05.237977	2026-03-04 23:05:05.237977
92	1	-6.208098490131587	107.01055845240059	91	\N	\N	2026-03-04 23:05:15.2404	2026-03-04 23:05:15.2404
93	1	-6.208098490131587	107.01055845240059	91	\N	\N	2026-03-04 23:05:25.248708	2026-03-04 23:05:25.248708
94	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 23:05:35.233787	2026-03-04 23:05:35.233787
95	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 23:05:45.2311	2026-03-04 23:05:45.2311
96	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 23:05:55.23858	2026-03-04 23:05:55.23858
97	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:06:05.254696	2026-03-04 23:06:05.254696
98	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:06:15.235565	2026-03-04 23:06:15.235565
99	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:06:25.2446	2026-03-04 23:06:25.2446
100	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:06:35.243914	2026-03-04 23:06:35.243914
101	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:06:45.239414	2026-03-04 23:06:45.239414
102	1	-6.208100644377279	107.01069220477257	79	\N	\N	2026-03-04 23:06:55.252959	2026-03-04 23:06:55.252959
103	1	-6.208094253113286	107.01067860402166	81	\N	\N	2026-03-04 23:07:05.247979	2026-03-04 23:07:05.247979
104	1	-6.208094253113286	107.01067860402166	81	\N	\N	2026-03-04 23:07:15.243689	2026-03-04 23:07:15.243689
105	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:07:25.226394	2026-03-04 23:07:25.226394
106	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:07:35.237104	2026-03-04 23:07:35.237104
107	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:07:45.227081	2026-03-04 23:07:45.227081
108	1	-6.208148525987526	107.01056651991045	96	\N	\N	2026-03-04 23:07:55.29176	2026-03-04 23:07:55.29176
109	1	-6.208148525987526	107.01056651991045	96	\N	\N	2026-03-04 23:08:05.226615	2026-03-04 23:08:05.226615
110	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:08:15.244438	2026-03-04 23:08:15.244438
111	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:08:25.238805	2026-03-04 23:08:25.238805
112	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:08:35.241459	2026-03-04 23:08:35.241459
113	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:08:45.23672	2026-03-04 23:08:45.23672
114	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 23:08:55.238663	2026-03-04 23:08:55.238663
115	1	-6.2081114014257075	107.01053332256627	108	\N	\N	2026-03-04 23:09:05.228102	2026-03-04 23:09:05.228102
116	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 23:09:15.239728	2026-03-04 23:09:15.239728
117	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:09:25.252511	2026-03-04 23:09:25.252511
118	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:09:35.251271	2026-03-04 23:09:35.251271
119	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:09:45.243949	2026-03-04 23:09:45.243949
120	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:09:55.242805	2026-03-04 23:09:55.242805
121	1	-6.208113165469454	107.01069944906126	81	\N	\N	2026-03-04 23:10:05.226147	2026-03-04 23:10:05.226147
122	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:10:15.252899	2026-03-04 23:10:15.252899
123	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:10:25.248845	2026-03-04 23:10:25.248845
124	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:10:35.244476	2026-03-04 23:10:35.244476
125	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:10:45.229315	2026-03-04 23:10:45.229315
126	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:10:55.236658	2026-03-04 23:10:55.236658
127	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:11:05.236173	2026-03-04 23:11:05.236173
128	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:11:15.248398	2026-03-04 23:11:15.248398
129	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:11:25.243103	2026-03-04 23:11:25.243103
130	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:11:35.242394	2026-03-04 23:11:35.242394
131	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:11:45.242325	2026-03-04 23:11:45.242325
132	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:11:55.236942	2026-03-04 23:11:55.236942
133	1	-6.2080985803671584	107.01073129885378	81	\N	\N	2026-03-04 23:12:05.248177	2026-03-04 23:12:05.248177
134	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 23:12:15.224426	2026-03-04 23:12:15.224426
135	1	-6.208129099402852	107.0105627974576	94	\N	\N	2026-03-04 23:12:25.239359	2026-03-04 23:12:25.239359
136	1	-6.208098490131587	107.01055845240059	91	\N	\N	2026-03-04 23:12:35.237043	2026-03-04 23:12:35.237043
137	1	-6.208064461842605	107.01053665986494	94	\N	\N	2026-03-04 23:12:45.251341	2026-03-04 23:12:45.251341
138	1	-6.2080718826603665	107.01068275546633	81	\N	\N	2026-03-04 23:12:55.235678	2026-03-04 23:12:55.235678
139	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:13:05.233294	2026-03-04 23:13:05.233294
140	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:13:15.242579	2026-03-04 23:13:15.242579
141	1	-6.2080901828834945	107.01070802524444	81	\N	\N	2026-03-04 23:13:25.236751	2026-03-04 23:13:25.236751
142	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:13:35.237889	2026-03-04 23:13:35.237889
143	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:13:45.238252	2026-03-04 23:13:45.238252
144	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:13:55.223049	2026-03-04 23:13:55.223049
145	1	-6.208122863656597	107.01071779708626	79	\N	\N	2026-03-04 23:14:05.224211	2026-03-04 23:14:05.224211
147	1	-6.140071499264976	106.77779603748621	103	\N	\N	2026-03-11 15:13:46.066572	2026-03-11 15:13:46.066572
146	1	-6.140071499264976	106.77779603748621	103	\N	\N	2026-03-11 15:13:46.068524	2026-03-11 15:13:46.068524
148	1	-6.140071499264976	106.77779603748621	103	\N	\N	2026-03-11 15:13:54.33258	2026-03-11 15:13:54.33258
149	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-11 15:14:04.331966	2026-03-11 15:14:04.331966
150	1	-6.140079346604996	106.77780689952242	91	\N	\N	2026-03-11 15:14:14.340692	2026-03-11 15:14:14.340692
151	1	-6.140079346604996	106.77780689952242	91	\N	\N	2026-03-11 15:14:24.357737	2026-03-11 15:14:24.357737
152	1	-6.140085364090007	106.77780093629993	87	\N	\N	2026-03-11 15:14:34.372845	2026-03-11 15:14:34.372845
153	1	-6.140085364090007	106.77780093629993	87	\N	\N	2026-03-11 15:14:44.362725	2026-03-11 15:14:44.362725
154	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-11 15:14:54.390387	2026-03-11 15:14:54.390387
155	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-11 15:15:04.344013	2026-03-11 15:15:04.344013
156	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-11 15:15:14.327974	2026-03-11 15:15:14.327974
157	1	-6.140089199639436	106.7777912039677	93	\N	\N	2026-03-11 15:15:24.351326	2026-03-11 15:15:24.351326
158	1	-6.140089199639436	106.7777912039677	93	\N	\N	2026-03-11 15:15:34.377021	2026-03-11 15:15:34.377021
159	1	-6.140089199639436	106.7777912039677	93	\N	\N	2026-03-11 15:15:44.354136	2026-03-11 15:15:44.354136
160	1	-6.140089199639436	106.7777912039677	93	\N	\N	2026-03-11 15:15:54.354034	2026-03-11 15:15:54.354034
161	1	-6.140089199639436	106.7777912039677	93	\N	\N	2026-03-11 15:16:04.347391	2026-03-11 15:16:04.347391
162	1	-6.1400878443394085	106.77779127915863	87	\N	\N	2026-03-11 15:19:04.120222	2026-03-11 15:19:04.120222
163	1	-6.140023991958813	106.77778934317372	89	\N	\N	2026-03-11 15:19:04.356756	2026-03-11 15:19:04.356756
164	1	-6.140023991958813	106.77778934317372	89	\N	\N	2026-03-11 15:19:14.351836	2026-03-11 15:19:14.351836
165	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:19:24.473647	2026-03-11 15:19:24.473647
166	1	-6.140092118811782	106.77779935316201	87	\N	\N	2026-03-11 15:19:34.338805	2026-03-11 15:19:34.338805
167	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:19:44.439433	2026-03-11 15:19:44.439433
168	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:19:54.870824	2026-03-11 15:19:54.870824
169	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:20:04.830335	2026-03-11 15:20:04.830335
170	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:20:14.821573	2026-03-11 15:20:14.821573
171	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:20:24.809056	2026-03-11 15:20:24.809056
172	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:20:34.807126	2026-03-11 15:20:34.807126
173	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:20:44.804045	2026-03-11 15:20:44.804045
174	1	-6.140027858361295	106.7777966463784	89	\N	\N	2026-03-11 15:21:07.759679	2026-03-11 15:21:07.759679
175	1	-6.140082053084347	106.77779085459504	87	\N	\N	2026-03-11 15:21:14.372752	2026-03-11 15:21:14.372752
176	1	-6.140082053084347	106.77779085459504	87	\N	\N	2026-03-11 15:21:24.335898	2026-03-11 15:21:24.335898
177	1	-6.140082053084347	106.77779085459504	87	\N	\N	2026-03-11 15:21:34.879692	2026-03-11 15:21:34.879692
178	1	-6.140085959389929	106.77780074807056	88	\N	\N	2026-03-11 15:21:44.354769	2026-03-11 15:21:44.354769
179	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:21:54.343841	2026-03-11 15:21:54.343841
180	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:22:04.339274	2026-03-11 15:22:04.339274
181	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:22:14.347899	2026-03-11 15:22:14.347899
182	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:22:24.341767	2026-03-11 15:22:24.341767
183	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:22:34.895812	2026-03-11 15:22:34.895812
184	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:22:44.803052	2026-03-11 15:22:44.803052
185	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:22:54.900481	2026-03-11 15:22:54.900481
186	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:23:04.828486	2026-03-11 15:23:04.828486
187	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:23:14.815206	2026-03-11 15:23:14.815206
188	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:23:24.800544	2026-03-11 15:23:24.800544
189	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:23:34.809863	2026-03-11 15:23:34.809863
190	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:23:44.803736	2026-03-11 15:23:44.803736
191	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:23:54.814009	2026-03-11 15:23:54.814009
192	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:24:36.868298	2026-03-11 15:24:36.868298
193	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:25:36.858465	2026-03-11 15:25:36.858465
194	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:26:36.878464	2026-03-11 15:26:36.878464
195	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:27:36.960193	2026-03-11 15:27:36.960193
196	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:28:36.86632	2026-03-11 15:28:36.86632
197	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:29:36.875296	2026-03-11 15:29:36.875296
198	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:30:36.868109	2026-03-11 15:30:36.868109
199	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:31:36.870382	2026-03-11 15:31:36.870382
200	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:32:36.853221	2026-03-11 15:32:36.853221
201	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:33:36.864579	2026-03-11 15:33:36.864579
202	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:34:36.849092	2026-03-11 15:34:36.849092
203	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:35:36.958919	2026-03-11 15:35:36.958919
204	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:36:37.082812	2026-03-11 15:36:37.082812
205	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:37:36.868827	2026-03-11 15:37:36.868827
206	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:38:36.867881	2026-03-11 15:38:36.867881
207	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:39:36.961244	2026-03-11 15:39:36.961244
208	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:40:36.867893	2026-03-11 15:40:36.867893
209	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:41:36.872088	2026-03-11 15:41:36.872088
210	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:42:36.840602	2026-03-11 15:42:36.840602
211	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:43:36.858822	2026-03-11 15:43:36.858822
212	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:44:36.843105	2026-03-11 15:44:36.843105
213	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:45:36.872152	2026-03-11 15:45:36.872152
214	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:46:36.854505	2026-03-11 15:46:36.854505
215	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:47:36.862122	2026-03-11 15:47:36.862122
216	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:48:36.840446	2026-03-11 15:48:36.840446
217	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:49:36.856261	2026-03-11 15:49:36.856261
218	1	-6.140021748490705	106.7777980783793	89	\N	\N	2026-03-11 15:50:07.286594	2026-03-11 15:50:07.286594
219	1	-6.140085364090007	106.77780093629993	87	\N	\N	2026-03-11 15:50:14.341032	2026-03-11 15:50:14.341032
220	1	-6.140085364090007	106.77780093629993	87	\N	\N	2026-03-11 15:50:20.82035	2026-03-11 15:50:20.82035
221	1	-6.140085364090007	106.77780093629993	87	\N	\N	2026-03-11 15:50:20.889389	2026-03-11 15:50:20.889389
222	1	-6.140085364090007	106.77780093629993	87	\N	\N	2026-03-11 15:50:30.640467	2026-03-11 15:50:30.640467
223	1	-6.140085364090007	106.77780093629993	87	\N	\N	2026-03-11 15:50:40.873786	2026-03-11 15:50:40.873786
224	1	-6.140085364090007	106.77780093629993	87	\N	\N	2026-03-11 15:50:50.811405	2026-03-11 15:50:50.811405
225	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:51:00.646884	2026-03-11 15:51:00.646884
226	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:51:10.639022	2026-03-11 15:51:10.639022
227	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:51:20.669356	2026-03-11 15:51:20.669356
228	1	-6.1400011963557555	106.77780265091025	92	\N	\N	2026-03-11 15:51:30.638561	2026-03-11 15:51:30.638561
229	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:51:40.632375	2026-03-11 15:51:40.632375
230	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:51:50.645563	2026-03-11 15:51:50.645563
231	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:52:00.864495	2026-03-11 15:52:00.864495
232	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:52:10.841203	2026-03-11 15:52:10.841203
233	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:52:20.817188	2026-03-11 15:52:20.817188
234	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:52:30.801248	2026-03-11 15:52:30.801248
235	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:52:40.817162	2026-03-11 15:52:40.817162
236	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:52:50.792557	2026-03-11 15:52:50.792557
237	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:53:36.871131	2026-03-11 15:53:36.871131
238	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:54:24.220159	2026-03-11 15:54:24.220159
239	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:54:30.798885	2026-03-11 15:54:30.798885
240	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:54:40.856995	2026-03-11 15:54:40.856995
241	1	-6.140045131304977	106.77780396177774	93	\N	\N	2026-03-11 15:54:50.806786	2026-03-11 15:54:50.806786
242	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:55:24.31221	2026-03-11 15:55:24.31221
243	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:55:24.314171	2026-03-11 15:55:24.314171
244	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:55:32.627086	2026-03-11 15:55:32.627086
245	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:55:42.975108	2026-03-11 15:55:42.975108
246	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:55:52.793716	2026-03-11 15:55:52.793716
247	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:56:02.788439	2026-03-11 15:56:02.788439
248	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:56:12.848787	2026-03-11 15:56:12.848787
249	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:56:22.792172	2026-03-11 15:56:22.792172
250	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-11 15:56:32.876641	2026-03-11 15:56:32.876641
251	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:40:42.190455	2026-03-12 11:40:42.190455
252	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:40:42.265209	2026-03-12 11:40:42.265209
253	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:40:50.4296	2026-03-12 11:40:50.4296
254	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:41:00.428416	2026-03-12 11:41:00.428416
255	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:41:10.485659	2026-03-12 11:41:10.485659
256	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:41:20.934182	2026-03-12 11:41:20.934182
257	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:41:30.891124	2026-03-12 11:41:30.891124
258	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:41:40.887347	2026-03-12 11:41:40.887347
259	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:41:50.868426	2026-03-12 11:41:50.868426
260	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:42:01.021618	2026-03-12 11:42:01.021618
261	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:42:10.883743	2026-03-12 11:42:10.883743
262	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:43:11.919997	2026-03-12 11:43:11.919997
263	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 11:43:19.203795	2026-03-12 11:43:19.203795
264	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 11:43:19.289857	2026-03-12 11:43:19.289857
265	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 11:43:29.012158	2026-03-12 11:43:29.012158
266	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 11:43:39.007192	2026-03-12 11:43:39.007192
267	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 11:43:49.011968	2026-03-12 11:43:49.011968
268	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 11:43:59.006189	2026-03-12 11:43:59.006189
269	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 11:44:09.012868	2026-03-12 11:44:09.012868
270	1	-6.14007871924871	106.77780805794255	94	\N	\N	2026-03-12 11:44:19.013299	2026-03-12 11:44:19.013299
271	1	-6.14007871924871	106.77780805794255	94	\N	\N	2026-03-12 11:44:29.016342	2026-03-12 11:44:29.016342
272	1	-6.14007871924871	106.77780805794255	94	\N	\N	2026-03-12 11:44:39.013762	2026-03-12 11:44:39.013762
273	1	-6.14007871924871	106.77780805794255	94	\N	\N	2026-03-12 11:44:49.0119	2026-03-12 11:44:49.0119
274	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:44:59.005409	2026-03-12 11:44:59.005409
275	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:45:09.0706	2026-03-12 11:45:09.0706
276	1	-6.140074244166142	106.77779759609244	92	\N	\N	2026-03-12 11:45:19.018834	2026-03-12 11:45:19.018834
277	1	-6.140083974196775	106.77779471284578	91	\N	\N	2026-03-12 11:45:28.997641	2026-03-12 11:45:28.997641
278	1	-6.140083974196775	106.77779471284578	91	\N	\N	2026-03-12 11:45:39.012185	2026-03-12 11:45:39.012185
279	1	-6.140083974196775	106.77779471284578	91	\N	\N	2026-03-12 11:45:49.015144	2026-03-12 11:45:49.015144
280	1	-6.139965226484966	106.777790911228	95	\N	\N	2026-03-12 11:45:59.005092	2026-03-12 11:45:59.005092
281	1	-6.139965226484966	106.777790911228	95	\N	\N	2026-03-12 11:46:09.016292	2026-03-12 11:46:09.016292
282	1	-6.139965226484966	106.777790911228	95	\N	\N	2026-03-12 11:46:19.016822	2026-03-12 11:46:19.016822
283	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 11:46:29.011127	2026-03-12 11:46:29.011127
284	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 11:46:38.998253	2026-03-12 11:46:38.998253
285	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 11:46:49.004342	2026-03-12 11:46:49.004342
286	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:20:12.595015	2026-03-12 14:20:12.595015
287	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:20:12.601143	2026-03-12 14:20:12.601143
288	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:20:20.850229	2026-03-12 14:20:20.850229
289	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:20:30.850392	2026-03-12 14:20:30.850392
290	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:20:40.861075	2026-03-12 14:20:40.861075
291	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:20:50.854825	2026-03-12 14:20:50.854825
292	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:21:00.860992	2026-03-12 14:21:00.860992
293	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:21:10.848011	2026-03-12 14:21:10.848011
294	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:21:20.859266	2026-03-12 14:21:20.859266
295	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:21:30.855663	2026-03-12 14:21:30.855663
296	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:21:40.856693	2026-03-12 14:21:40.856693
297	1	-6.1400740512633645	106.7777970385333	91	\N	\N	2026-03-12 14:21:50.850618	2026-03-12 14:21:50.850618
298	1	-6.140082501092032	106.777794617158	91	\N	\N	2026-03-12 14:22:00.853088	2026-03-12 14:22:00.853088
299	1	-6.140082501092032	106.777794617158	91	\N	\N	2026-03-12 14:22:10.858557	2026-03-12 14:22:10.858557
300	1	-6.140082501092032	106.777794617158	91	\N	\N	2026-03-12 14:22:21.100641	2026-03-12 14:22:21.100641
301	1	-6.140082501092032	106.777794617158	91	\N	\N	2026-03-12 14:22:29.429825	2026-03-12 14:22:29.429825
302	1	-6.140088878537302	106.77778938202866	88	\N	\N	2026-03-12 14:25:03.450841	2026-03-12 14:25:03.450841
303	1	-6.140088878537302	106.77778938202866	88	\N	\N	2026-03-12 14:25:03.453007	2026-03-12 14:25:03.453007
304	1	-6.140088878537302	106.77778938202866	88	\N	\N	2026-03-12 14:25:11.733708	2026-03-12 14:25:11.733708
305	1	-6.1400878443394085	106.77779127915863	87	\N	\N	2026-03-12 14:25:21.785108	2026-03-12 14:25:21.785108
306	1	-6.1400878443394085	106.77779127915863	87	\N	\N	2026-03-12 14:25:31.742064	2026-03-12 14:25:31.742064
307	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-12 14:25:41.761754	2026-03-12 14:25:41.761754
308	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-12 14:25:51.927198	2026-03-12 14:25:51.927198
309	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-12 14:26:01.737355	2026-03-12 14:26:01.737355
310	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-12 14:26:11.787768	2026-03-12 14:26:11.787768
311	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-12 14:26:21.752982	2026-03-12 14:26:21.752982
312	1	-6.140082044161276	106.77779272805194	85	\N	\N	2026-03-12 14:26:31.74824	2026-03-12 14:26:31.74824
313	1	-6.140060053197865	106.77779418172214	104	\N	\N	2026-03-12 15:45:31.875487	2026-03-12 15:45:31.875487
314	1	-6.140060053197865	106.77779418172214	104	\N	\N	2026-03-12 15:45:31.878011	2026-03-12 15:45:31.878011
315	1	-6.140060053197865	106.77779418172214	104	\N	\N	2026-03-12 15:45:40.192426	2026-03-12 15:45:40.192426
316	1	-6.140074541143251	106.77779367639913	99	\N	\N	2026-03-12 15:45:50.20275	2026-03-12 15:45:50.20275
317	1	-6.140074541143251	106.77779367639913	99	\N	\N	2026-03-12 15:46:00.190677	2026-03-12 15:46:00.190677
318	1	-6.1400671826732935	106.77779355362156	99	\N	\N	2026-03-12 15:46:10.196228	2026-03-12 15:46:10.196228
319	1	-6.1400671826732935	106.77779355362156	99	\N	\N	2026-03-12 15:46:20.202245	2026-03-12 15:46:20.202245
320	1	-6.1400671826732935	106.77779355362156	99	\N	\N	2026-03-12 15:46:30.191903	2026-03-12 15:46:30.191903
321	1	-6.140101626088396	106.77779663580615	101	\N	\N	2026-03-12 15:46:40.204886	2026-03-12 15:46:40.204886
322	1	-6.140116984631721	106.77779553203425	99	\N	\N	2026-03-12 15:46:50.198953	2026-03-12 15:46:50.198953
323	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:47:00.185718	2026-03-12 15:47:00.185718
324	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:47:10.924683	2026-03-12 15:47:10.924683
325	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:47:20.867644	2026-03-12 15:47:20.867644
326	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:47:30.884293	2026-03-12 15:47:30.884293
327	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:47:40.873974	2026-03-12 15:47:40.873974
328	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:47:50.871953	2026-03-12 15:47:50.871953
329	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:48:00.873198	2026-03-12 15:48:00.873198
330	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:48:11.916919	2026-03-12 15:48:11.916919
331	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:49:11.928634	2026-03-12 15:49:11.928634
332	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:50:11.922122	2026-03-12 15:50:11.922122
333	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:51:11.911394	2026-03-12 15:51:11.911394
334	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:52:11.934075	2026-03-12 15:52:11.934075
335	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:53:12.038621	2026-03-12 15:53:12.038621
336	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:54:11.925803	2026-03-12 15:54:11.925803
337	1	-6.140141625626226	106.77779463103083	102	\N	\N	2026-03-12 15:54:43.925534	2026-03-12 15:54:43.925534
338	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:54:50.204897	2026-03-12 15:54:50.204897
339	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:55:00.213911	2026-03-12 15:55:00.213911
340	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:55:10.199459	2026-03-12 15:55:10.199459
341	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:55:20.195158	2026-03-12 15:55:20.195158
342	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:55:30.182792	2026-03-12 15:55:30.182792
343	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:55:40.913729	2026-03-12 15:55:40.913729
344	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:55:50.874803	2026-03-12 15:55:50.874803
345	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:56:00.886767	2026-03-12 15:56:00.886767
346	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:56:10.994748	2026-03-12 15:56:10.994748
347	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:56:20.887962	2026-03-12 15:56:20.887962
348	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:56:30.888469	2026-03-12 15:56:30.888469
349	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:57:11.918213	2026-03-12 15:57:11.918213
350	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:58:11.942526	2026-03-12 15:58:11.942526
351	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 15:59:11.930085	2026-03-12 15:59:11.930085
352	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:00:11.951826	2026-03-12 16:00:11.951826
353	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:01:11.933373	2026-03-12 16:01:11.933373
354	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:02:11.940237	2026-03-12 16:02:11.940237
355	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:03:11.919694	2026-03-12 16:03:11.919694
356	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:04:11.931044	2026-03-12 16:04:11.931044
357	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:05:11.920845	2026-03-12 16:05:11.920845
358	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:06:11.927724	2026-03-12 16:06:11.927724
359	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:07:11.921922	2026-03-12 16:07:11.921922
360	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:08:11.912524	2026-03-12 16:08:11.912524
361	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:09:11.908016	2026-03-12 16:09:11.908016
362	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:10:11.92901	2026-03-12 16:10:11.92901
363	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:11:11.935391	2026-03-12 16:11:11.935391
364	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:12:11.922479	2026-03-12 16:12:11.922479
365	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:13:11.954311	2026-03-12 16:13:11.954311
366	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:14:11.929373	2026-03-12 16:14:11.929373
367	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:15:11.935116	2026-03-12 16:15:11.935116
368	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:16:11.92021	2026-03-12 16:16:11.92021
369	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:17:11.934059	2026-03-12 16:17:11.934059
370	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:18:11.920209	2026-03-12 16:18:11.920209
371	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:19:11.92073	2026-03-12 16:19:11.92073
372	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:20:11.932163	2026-03-12 16:20:11.932163
373	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:21:11.95597	2026-03-12 16:21:11.95597
374	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:22:11.948108	2026-03-12 16:22:11.948108
375	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:23:11.965997	2026-03-12 16:23:11.965997
376	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:24:11.966662	2026-03-12 16:24:11.966662
377	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:25:11.954009	2026-03-12 16:25:11.954009
378	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:26:11.946971	2026-03-12 16:26:11.946971
379	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:27:11.942792	2026-03-12 16:27:11.942792
380	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:28:11.966871	2026-03-12 16:28:11.966871
381	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:29:11.953677	2026-03-12 16:29:11.953677
382	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:30:11.932548	2026-03-12 16:30:11.932548
383	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:31:11.951462	2026-03-12 16:31:11.951462
384	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:32:11.989638	2026-03-12 16:32:11.989638
385	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:33:11.943037	2026-03-12 16:33:11.943037
386	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:34:11.937478	2026-03-12 16:34:11.937478
387	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:35:11.926734	2026-03-12 16:35:11.926734
388	1	-6.14007179790992	106.77779563202826	96	\N	\N	2026-03-12 16:36:11.93552	2026-03-12 16:36:11.93552
389	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:36:20.875806	2026-03-12 16:36:20.875806
390	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:36:31.010649	2026-03-12 16:36:31.010649
391	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:36:40.89647	2026-03-12 16:36:40.89647
392	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:36:50.872931	2026-03-12 16:36:50.872931
393	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:37:00.918645	2026-03-12 16:37:00.918645
394	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:37:10.877779	2026-03-12 16:37:10.877779
395	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:38:11.944484	2026-03-12 16:38:11.944484
396	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:39:11.956156	2026-03-12 16:39:11.956156
397	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:40:11.924116	2026-03-12 16:40:11.924116
398	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:41:11.937743	2026-03-12 16:41:11.937743
399	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:42:11.922858	2026-03-12 16:42:11.922858
400	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:43:11.925855	2026-03-12 16:43:11.925855
401	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:44:11.950663	2026-03-12 16:44:11.950663
402	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:45:11.934712	2026-03-12 16:45:11.934712
403	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:46:11.926046	2026-03-12 16:46:11.926046
404	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:47:11.918235	2026-03-12 16:47:11.918235
405	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:48:11.96074	2026-03-12 16:48:11.96074
406	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:49:11.932112	2026-03-12 16:49:11.932112
407	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:50:11.919482	2026-03-12 16:50:11.919482
408	1	-6.1400845338534	106.77779264704151	96	\N	\N	2026-03-12 16:50:45.579424	2026-03-12 16:50:45.579424
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, phone, avatar, is_active, created_at, updated_at) FROM stdin;
1	Wisnu Wardana	jagatrayasolusindo@gmail.com	$2b$12$vFd3MQNC06q7BkADJ79Piu3g6wD2Sglu5ugPRl0J1O8c.GVJIKWBe	sales	08129983803	\N	t	2026-03-03 12:49:26.869698	2026-03-03 12:49:26.869698
7	Admin CRM	admin@crmplus.com	$2b$12$efdCjhKviGNtZVgxRfFfL.lri9d1ck4Vx1n.oFdREdtCMPfR1oTte	admin	08123456789	\N	t	2026-03-04 22:42:30.053153	2026-03-04 22:42:30.053153
5	Super Admin	superadmin@crmplus.com	$2b$12$V.q4tyUR1NM5RzQNFdCP2OjCGn/Ps6JtnphP5wV6Iq6pFhu11SnHu	admin	08111583803	\N	t	2026-03-04 12:32:55.793385	2026-03-12 14:23:01.616196
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visits (id, customer_id, user_id, checkin_time, checkout_time, checkin_lat, checkin_lng, checkout_lat, checkout_lng, checkin_address, checkout_address, checkin_photo, notes, summary, status, created_at) FROM stdin;
2	4	5	2026-03-04 17:51:15.93299	2026-03-04 17:51:22.126975	-6.1400752064065856	106.77779454776037	-6.1400752064065856	106.77779454776037	-6.140075, 106.777795	-6.140075, 106.777795	\N	tes	\N	checked_out	2026-03-04 17:51:15.93299
3	3	5	2026-03-04 18:11:13.607101	2026-03-04 21:24:24.160802	-6.139984074663306	106.77779127752645	-6.2080985803671584	107.01073129885378	-6.139984, 106.777791	-6.208099, 107.010731	\N	\N	\N	checked_out	2026-03-04 18:11:13.607101
5	7	1	2026-03-12 14:25:23.53747	2026-03-12 14:25:40.10766	-6.1400878443394085	106.77779127915863	-6.140082044161276	106.77779272805194	-6.140088, 106.777791	-6.140082, 106.777793	\N	\N	\N	checked_out	2026-03-12 14:25:23.53747
6	7	1	2026-03-12 15:46:17.556666	2026-03-12 15:55:08.33467	\N	\N	\N	\N	\N	\N	\N	\N	\N	checked_out	2026-03-12 15:46:17.556666
\.


--
-- Name: activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activities_id_seq', 20, true);


--
-- Name: campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campaigns_id_seq', 1, false);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contacts_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 7, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leads_id_seq', 1, true);


--
-- Name: opportunities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opportunities_id_seq', 1, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 3, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 3, true);


--
-- Name: pipeline_stages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pipeline_stages_id_seq', 5, true);


--
-- Name: product_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_categories_id_seq', 11, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 13, true);


--
-- Name: user_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_locations_id_seq', 408, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visits_id_seq', 6, true);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: customers customers_customer_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customer_code_key UNIQUE (customer_code);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: leads leads_lead_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_lead_code_key UNIQUE (lead_code);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: pipeline_stages pipeline_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_product_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_code_key UNIQUE (product_code);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: user_locations user_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_locations
    ADD CONSTRAINT user_locations_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: idx_user_locations_recorded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_locations_recorded_at ON public.user_locations USING btree (recorded_at);


--
-- Name: idx_user_locations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_locations_user_id ON public.user_locations USING btree (user_id);


--
-- Name: activities activities_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: activities activities_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id);


--
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: campaigns campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: contacts contacts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customers customers_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: customers customers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: leads leads_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: opportunities opportunities_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: opportunities opportunities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: opportunities opportunities_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: opportunities opportunities_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_locations user_locations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_locations
    ADD CONSTRAINT user_locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: visits visits_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: visits visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict URqUjgWDFR7q3BlbkePW2fNh5LHKARhS6K4XjSExlh08gpyUVif2yHN06vC3Zmf

