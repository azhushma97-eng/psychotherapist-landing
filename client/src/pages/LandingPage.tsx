import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  HeartCrack, 
  Brain, 
  BatteryWarning, 
  Users, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Video,
  BookOpen,
  Heart,
  ChevronDown
} from "lucide-react";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { insertAppointmentSchema } from "@shared/schema";

const formSchema = insertAppointmentSchema;
type FormValues = z.infer<typeof formSchema>;

// Shared animation variants for smooth reveals
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function LandingPage() {
  const { mutate: createAppointment, isPending, isSuccess, isError, error } = useCreateAppointment();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      socialNetworks: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createAppointment(data, {
      onSuccess: () => {
        form.reset();
      }
    });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden selection:bg-primary/20">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-16">
        {/* Soft abstract gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-accent/20 z-0" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent z-0 opacity-70" />
        
        <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-7xl">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <motion.div variants={fadeInUp} className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-primary/10 text-primary font-medium text-sm shadow-sm">
                Врач-психотерапевт
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground text-balance leading-tight">
              Истушкина Дарья Николаевна
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto font-light">
              Безопасное пространство для вашего внутреннего роста и обретения гармонии с собой.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button size="lg" asChild className="w-full sm:w-auto text-base">
                <a href="#contact">Записаться на консультацию</a>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base">
                <a href="#about">Узнать больше</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <a href="#about" aria-label="Scroll down">
            <ChevronDown className="w-6 h-6 text-muted-foreground/50" />
          </a>
        </div>
      </section>

      {/* 2. ABOUT SECTION */}
      <section id="about" className="py-24 bg-white relative">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              {/* Abstract medical/trust placeholder for photo */}
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-tr from-secondary to-primary/10 p-1 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
                <div className="w-full h-full bg-white/40 rounded-[1.4rem] flex flex-col items-center justify-center text-primary/40 relative z-10">
                  <Heart className="w-24 h-24 mb-6 stroke-[1]" />
                  <p className="font-serif text-2xl italic">С заботой о вас</p>
                </div>
              </div>
              
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
                  Обо мне
                </h2>
                <div className="w-20 h-1 bg-primary/30 rounded-full" />
              </div>
              
              <div className="prose prose-lg text-muted-foreground">
                <p className="text-xl leading-relaxed">
                  Я — врач-психотерапевт с медицинским образованием.
                </p>
                <p>
                  Специализируюсь на работе с тревожными расстройствами, кризисами идентичности и эмоциональным выгоранием у молодых женщин. Мой подход основан на доказательной медицине и глубоком уважении к вашей уникальности.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Медицинское образование</h4>
                    <p className="text-sm text-muted-foreground">Фундаментальные знания о работе психики и тела.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-accent/10 p-2 rounded-lg text-accent shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Индивидуальный подход</h4>
                    <p className="text-sm text-muted-foreground">Бережные методики, подобранные специально для вас.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEMS SECTION */}
      <section className="py-24 bg-secondary/30">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">С чем я могу помочь</h2>
            <p className="text-lg text-muted-foreground">
              Каждая трудность — это сигнал, что пришло время бережно позаботиться о себе.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: HeartCrack,
                title: "Тревога и панические атаки",
                desc: "Постоянное беспокойство, необъяснимые страхи, ощущение потери контроля над своим состоянием.",
                color: "text-rose-500",
                bg: "bg-rose-50"
              },
              {
                icon: Sparkles,
                title: "Кризис самоидентификации",
                desc: "Ощущение потерянности, непонимание себя, своих истинных желаний и жизненного пути.",
                color: "text-purple-500",
                bg: "bg-purple-50"
              },
              {
                icon: BatteryWarning,
                title: "Депрессия и апатия",
                desc: "Постоянная усталость от жизни, полная потеря интереса, энергии и мотивации к действиям.",
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              {
                icon: Users,
                title: "Отношения и границы",
                desc: "Трудности в построении здоровых, поддерживающих отношений и защите личных границ.",
                color: "text-orange-500",
                bg: "bg-orange-50"
              },
              {
                icon: Brain,
                title: "Эмоциональное выгорание",
                desc: "Глубокое истощение от работы, учебы и постоянных обязанностей, нехватка сил.",
                color: "text-amber-500",
                bg: "bg-amber-50"
              },
              {
                icon: ShieldCheck,
                title: "Самооценка и уверенность",
                desc: "Хроническая неуверенность в себе, синдром самозванца и суровый внутренний критик.",
                color: "text-emerald-500",
                bg: "bg-emerald-50"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-8 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className={`w-7 h-7 ${item.color}`} />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Как проходит терапия</h2>
            <p className="text-lg text-muted-foreground">
              Понятный и бережный путь к вашему лучшему состоянию.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-border/60 hidden lg:block" />
            
            <div className="grid lg:grid-cols-3 gap-12 relative">
              {[
                {
                  step: "1",
                  title: "Первичная консультация",
                  desc: "Мы знакомимся, вы рассказываете о том, что вас беспокоит. Мы обсуждаем ваш запрос и выбираем наиболее подходящий формат работы."
                },
                {
                  step: "2",
                  title: "Индивидуальная программа",
                  desc: "На основе ваших целей мы составляем план терапии. Я подбираю бережные методики, которые сработают именно в вашей ситуации."
                },
                {
                  step: "3",
                  title: "Регулярная работа",
                  desc: "Еженедельные сессии в безопасном пространстве. Мы прорабатываем проблемы, я оказываю поддержку и мы отслеживаем позитивные изменения."
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.2 }}
                  className="relative flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-secondary flex items-center justify-center text-3xl font-serif font-bold text-primary shadow-lg relative z-10">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-foreground mb-4">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FORMATS */}
      <section className="py-24 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Форматы встреч</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-primary/10 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <MapPin className="w-32 h-32" />
                </div>
                <CardContent className="p-8 relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-foreground mb-4">Очно в Минске</h3>
                  <p className="text-muted-foreground mb-6 flex-grow">
                    Индивидуальные сессии в уютном, безопасном кабинете в центре Минска. Идеально для тех, кто ценит живое присутствие и хочет сменить обстановку.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm text-foreground/80">
                      <CheckCircle2 className="w-5 h-5 text-accent mr-3" /> Продолжительность: 60 минут
                    </li>
                    <li className="flex items-center text-sm text-foreground/80">
                      <CheckCircle2 className="w-5 h-5 text-accent mr-3" /> Безопасное пространство
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-primary/10 overflow-hidden relative group bg-white">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Video className="w-32 h-32" />
                </div>
                <CardContent className="p-8 relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-foreground mb-4">Онлайн-консультации</h3>
                  <p className="text-muted-foreground mb-6 flex-grow">
                    Работа по видеосвязи из любой точки Беларуси и мира. Удобный формат для тех, кто экономит время или находится в другом городе.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm text-foreground/80">
                      <CheckCircle2 className="w-5 h-5 text-primary mr-3" /> Продолжительность: 60 минут
                    </li>
                    <li className="flex items-center text-sm text-foreground/80">
                      <CheckCircle2 className="w-5 h-5 text-primary mr-3" /> Гибкое расписание
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-border/50 max-w-3xl mx-auto">
            <p className="text-lg text-foreground font-medium">
              Стоимость консультации — по запросу. <br className="sm:hidden" />
              <span className="text-primary mt-1 inline-block">Первая консультация ознакомительная.</span>
            </p>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Отзывы клиенток</h2>
            <p className="text-lg text-muted-foreground">
              Истории тех, кто уже прошел путь к гармонии.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Мария",
                age: "24 года",
                text: "Я обратилась с паническими атаками, которые мешали мне жить. После нескольких месяцев работы я снова чувствую контроль над своей жизнью. Огромная благодарность!"
              },
              {
                name: "Екатерина",
                age: "27 лет",
                text: "Долго не понимала, кто я и чего хочу. Терапия помогла мне найти себя и выстроить границы в отношениях. Очень рекомендую."
              },
              {
                name: "Алина",
                age: "22 года",
                text: "Пришла с выгоранием после университета. Дарья Николаевна помогла разобраться в причинах и найти ресурсы. Теперь живу в гармонии с собой."
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-none bg-secondary/20 shadow-md">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="mb-6 flex gap-1 text-accent">
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-foreground/80 italic leading-relaxed flex-grow mb-6">
                      "{testimonial.text}"
                    </p>
                    <div>
                      <p className="font-serif font-bold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.age}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-24 bg-secondary/30">
        <div className="container px-4 md:px-6 mx-auto max-w-3xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Частые вопросы</h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-black/[0.02]"
          >
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Нужно ли мне психическое расстройство, чтобы обратиться к психотерапевту?</AccordionTrigger>
                <AccordionContent>
                  Нет. Многие обращаются с жизненными трудностями, стрессом, выгоранием или желанием лучше понять себя, улучшить качество жизни и отношения с окружающими.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Чем психотерапевт отличается от психолога?</AccordionTrigger>
                <AccordionContent>
                  Психотерапевт — это врач с высшим медицинским образованием, который понимает работу не только психики, но и всего организма (нейромедиаторы, гормоны). Он может работать как с психологическими, так и с медицинскими аспектами состояния.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Как долго длится терапия?</AccordionTrigger>
                <AccordionContent>
                  Продолжительность зависит от вашего запроса. Краткосрочная работа (решение конкретной локальной проблемы) обычно занимает 8-12 сессий. Долгосрочная (глубинные изменения, травмы) — от нескольких месяцев.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Всё ли конфиденциально?</AccordionTrigger>
                <AccordionContent>
                  Да, абсолютно. Всё, что происходит и обсуждается на сессии, строго конфиденциально и защищено врачебной тайной и этическим кодексом.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>Как проходит онлайн-сессия?</AccordionTrigger>
                <AccordionContent>
                  Сессия проходит по видеосвязи (Skype, Zoom, Telegram) в удобное для вас время. Вам понадобится только стабильный интернет, устройство с камерой и тихое место, где вас никто не побеспокоит в течение 60 минут.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* 8. CONTACT FORM */}
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="container px-4 md:px-6 mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground leading-tight">
                Сделайте первый шаг <br/>
                <span className="text-primary italic font-light">к себе настоящей</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Оставьте заявку, и я свяжусь с вами, чтобы подобрать удобное время для ознакомительной встречи. Это ни к чему вас не обязывает.
              </p>
              
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Прием очно</p>
                    <p className="text-muted-foreground text-sm">г. Минск, центр</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Онлайн прием</p>
                    <p className="text-muted-foreground text-sm">По всему миру</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border border-border shadow-2xl shadow-primary/5">
                <CardContent className="p-8 md:p-10">
                  {isSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 space-y-6"
                    >
                      <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-foreground mb-2">Спасибо!</h3>
                        <p className="text-muted-foreground">
                          Ваша заявка успешно отправлена. Я свяжусь с вами в ближайшее время для уточнения деталей.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => form.reset()} className="mt-4">
                        Отправить еще одну
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {isError && (
                        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                          {error?.message || "Произошла ошибка. Пожалуйста, попробуйте еще раз."}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Ваше имя</label>
                        <Input 
                          placeholder="Анна" 
                          {...form.register("name")} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Социальные сети</label>
                        <Input 
                          placeholder="@username (Telegram, Instagram, ВКонтакте...)" 
                          {...form.register("socialNetworks")} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <Input 
                          placeholder="anna@example.com" 
                          type="email"
                          {...form.register("email")} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Сообщение (необязательно)</label>
                        <Textarea 
                          placeholder="Кратко опишите, с чем хотите обратиться..." 
                          {...form.register("message")} 
                        />
                      </div>
                      
                      <Button type="submit" size="lg" className="w-full text-base" disabled={isPending}>
                        {isPending ? "Отправка..." : "Отправить заявку"}
                      </Button>
                      
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-foreground text-white py-12">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8 items-center border-b border-white/10 pb-8 mb-8">
            <div>
              <h3 className="font-serif text-2xl font-bold mb-2">Истушкина Дарья Николаевна</h3>
              <p className="text-white/60">Врач-психотерапевт</p>
            </div>
            <div className="flex md:justify-end gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                <span className="sr-only">Telegram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-sm">
            <p>© 2026 Истушкина Дарья Николаевна. Все права защищены.</p>
            <p>Врач-психотерапевт, Минск, Беларусь.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
