"use client";

import React, { useState, useEffect, useRef } from "react";
import "./studenti-reprezentanti.css";
import BlogSection from "@/components/BlogSection";
import { Post } from "@/lib/posts";

const DOCUMENTS = [
    { title: "CARTA", icon: "fas fa-book", downloadLink: "/assets/pdf/carta.pdf" },
    { title: "ECTS", icon: "fas fa-graduation-cap", downloadLink: "/assets/pdf/ects.pdf" },
    { title: "BURSE", icon: "fas fa-money-bill", downloadLink: "/assets/pdf/burse.pdf" },
    { title: "TAXE", icon: "fas fa-file-invoice-dollar", downloadLink: "/assets/pdf/Taxele_pentru_anul_universitar_2026-2027-1.pdf" },
    { title: "CĂMINE & CANTINE", icon: "fas fa-building", downloadLink: "/assets/pdf/caminecantine.pdf" },
    { title: "CDOS", icon: "fas fa-file-alt", downloadLink: "/assets/pdf/CDOS.pdf" },
    { title: "Ghidul Studentului (Licență)", icon: "fas fa-book-open", downloadLink: "/assets/pdf/ghid_student_licenta.pdf" },
    { title: "Ghidul Studentului (Master)", icon: "fas fa-book-reader", downloadLink: "/assets/pdf/ghid_student_master.pdf" }
];

const SENAT_EVALUATION_FORM = "https://forms.office.com/e/kN7QuUwwq6";

const ACTIVITY_REPORTS: Record<string, string> = {
    "bondrea.ad.lucian@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/01. ARMM/01.Raport de activitate - Bondrea Lucian Andrei.pdf",
    "cracaoanu.co.klaudia@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/01. ARMM/02. Raport de activitate - Crăcăoanu Klaudia Maria.pdf",
    "veres.ra.georgian@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/01. ARMM/03. Raport de activitate - Vereș Georgian Ionut.pdf",
    "haitonic.al.dacian@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/01. ARMM/04. Raport de activitate - Haitonic Dacian-Alexandru.pdf",
    "bria.du.mara@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/01. ARMM/05.Raport de activitate - Bria Mara-Aiyana.pdf",
    "buzgariu.ni.ioana@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/01. ARMM/06.Raport de activitate - Buzgariu Ioana-Niculina.pdf",
    "iauta.ma.claudiu@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/01. ARMM/07. Raport de activitate - Iaută Claudiu Marian .pdf",
    "licu.ga.arina@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/01.Raport de activitate - Licu Arina.pdf",
    "dan.ni.andrada@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/02. Raport de activitate  - Dan Andrada.pdf",
    "livinschi.vi.ca@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/03. Raport de activitate - Livinschi Cătălina.pdf",
    "streza.co.cornel@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/04. Raport de activitate - Streza Bogdan.pdf",
    "maxim.va.andrei@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/05.Raport de activitate - Maxim Andrei.pdf",
    "mititean.vi.florina@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/06. Raport de activitate - Mititean Florina.pdf",
    "suciu.ni.bianca@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/07. Raport de activitate - Suciu Bianca.pdf",
    "afanas.va.neonila@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/08. Raport de activitate - Afanas Neonila.pdf",
    "negura.lu.daria@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/02. IIRMP/09. Raport de activitate - Negură Daria.pdf",
    "joia.da.simona@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/03. IMM/01.Raport de activitate - Simona Joia.pdf",
    "oltean.em.ariana@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/03. IMM/02.Raport de activitate - Oltean Ariana.pdf",
    "pop.io.rf@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/03. IMM/03.Raport de activitate - Pop Radu.pdf",
    "goman.pa.denis@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/03. IMM/04. Raport de activitate - Goman Denis.pdf",
    "abiculesei.so.denis@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Abiculesei Denis - Semestrul II.pdf",
    "chira.da.daria@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Chira Daria Larisa  - Semestrul II.pdf",
    "lenghel.io.carmen@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Lenghel Carmen Anamaria - Semestrul II (1).pdf",
    "marcu.pe.petra@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Marcu Petra-Denisa - Semestrul II.pdf",
    "ormindean.si.vlad@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Ormindean Vlad Cosmin - Semestrul II.pdf",
    "stan.pe.giulia@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Stan Giulia - Semestrul II.pdf",
    "stoian.gh.alexia@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Stoian-Pop Alexia-Ioana - Semestrul II.pdf",
    "timis.al.traian@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Timiș Traian-Marius - Semestrul II.pdf",
    "zinici.du.diana@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/04. Construcții/Raport de activitate - Zinici Diana - Semestrul II.pdf",
    "couti.ma.paul@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/05. Arhitectură/Raport de activitate - Couți Paul - Semestrul II.pdf",
    "dasca.pe.sabrina@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/05. Arhitectură/Raport de activitate - Dâscă Sabrina-Ioana - Semestrul II.pdf",
    "rusu.da.george@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/05. Arhitectură/Raport de activitate - Rusu George - Semestrul II.pdf",
    "costea.st.alina@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/06. Instalații/Raport de activitate - Costea Alina Paula - Semestrul II.pdf",
    "nasca.gh.tudor@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/06. Instalații/Raport de activitate - Nașca Tudor - Semestrul II.docx.pdf",
    "precub.io.alexandru@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/06. Instalații/Raport de activitate - Precub Alexandru-Ioan - Semestrul II.pdf",
    "cos.ad.tudor@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/01. Raport de activitate - Tudor-Adrian Coș.pdf",
    "moiceanu.io.elena@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/02. Raport de activitate  - Elena Moiceanu.pdf",
    "balanescu.co.rares@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/03. Raport de activitate - Rareș-Ioan Bălănescu.pdf",
    "juravle.va.monica@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/04. Raport de activitate - Monica Juravle.pdf",
    "tudose.ar.rares@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/05. Raport de activitate - Rareș Tudose.pdf",
    "santeiu.ca.anda@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/06. Raport de activitate - Anda-Ștefania Santeiu.pdf",
    "indreiu.da.daniela@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/07. Raport de activitate - Daniela Indreiu.pdf",
    "sisestean.pe.andrei@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/08. Raport de activitate - Andrei Șișeștean.pdf",
    "pavel.ma.luca@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/09. Raport de activitate - Luca-Georgian Pavel.pdf",
    "clim.fl.diana@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/10. Raport de activitate - Diana-Florentina Clim.pdf",
    "murariu.io.georgiana@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/07. AC/11. Raport de activitate - Georgiana-Roxana Murariu.pdf",
    "arimia.io.andreea@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/08. ETTI/01. Raport de activitate - Andreea-Ștefania Arimia.pdf",
    "irimiciuc.gh.cosmin@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/08. ETTI/02. Raport de activitate - Cosmin-Alexandru Irimiciuc.pdf",
    "bujdei.gh.robert@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/08. ETTI/03. Raport de activitate - Robert-Cosmin Bujdei.pdf",
    "ciotea.ad.alexandra@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/08. ETTI/04. Raport de activitate - Alexandra-Anamaria Ciotea.pdf",
    "tivadar.io.dragos@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/08. ETTI/05. Raport de activitate - Dragoș-Filip Tivadar.pdf",
    "pop.io.lorena@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/08. ETTI/06. Raport de activitate - Lorena-Maria Pop.pdf",
    "signori.gi.gianmario@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/08. ETTI/07. Raport de activitate - Gianmario Signori.pdf",
    "drule.vi.daniela@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/08. ETTI/08. Raport de activitate - Daniela-Ileana Drule.pdf",
    "spatacean.gh.lidia@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/09. IE/01. Raport de activitate - Lidia-Giorgiana Spătăcean.pdf",
    "dumitrean.se.denis@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/09. IE/02. Raport de activitate - Denis-Andrei Dumitrean.pdf",
    "moldovan.ma.ana@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/09. IE/03. Raport de activitate - Ana-Maria Moldovan.pdf",
    "dragus.ma.ioan@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/09. IE/04. Raport de activitate - Ioan-Darius Drăguș.pdf",
    "constandache.il.io@student.utcluj.ro": "/assets/02. Rapoarte de activitate/01. Cluj-Napoca/09. IE/06. Raport de activitate - Ionela Constandache.pdf",
    "gaier.ad.andreea@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/01. Litere/01. Raport de activitate - Gaier Andreea.pdf",
    "muresan.co.maria@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/01. Litere/02. Raport de activitate - Mureșan Ana-Maria.pdf",
    "popdan.gh.nicoleta@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/01. Litere/03.Raport de activitate - Popdan Nicoleta.pdf",
    "suciu.al.alexandra@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/01. Litere/04. Raport de activitate - Suciu Alexandra.pdf",
    "gyorgy.sa.melissza@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/02. Inginerie/Raport de activitate - Gyorgy Melissza Szemida - Semestrul II.pdf",
    "koloszvary.al.al@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/02. Inginerie/Raport de activitate - Koloszvary Alexandru Andrei - Semestrul II.pdf",
    "sillai.al.beatrice@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/02. Inginerie/Raport de activitate - Sillai Beatrice - Semestrul II.pdf",
    "tintas.gh.gheorghe@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/02. Inginerie/Raport de activitate - Țînțaș Gheorghe-Mihăiță - Semestrul II.pdf",
    "covaci.cs.sebastian@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/03. Științe/01. Raport de activitate - Sebastian-Gabriel Covaci.pdf",
    "borbei.al.alexandra@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/03. Științe/02. Raport de activitate - Alexandra Borbei.pdf",
    "borsa.fe.catalin@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/03. Științe/03. Raport de activitate - Cătălin Borșa.pdf",
    "leonte.ma.cosmin@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/03. Științe/04. Raport de activitate - Cosmin Leonte.pdf",
    "rus.ro.gabriela@student.utcluj.ro": "/assets/02. Rapoarte de activitate/02. Baia Mare/03. Științe/05. Raport de activitate - Gabriela-Maria Rus.pdf",
};

const senatMembers = [
    {nume: "Licu", prenume: "Arina-Andreea", subtitlu: "Student Reprezentant în BOS", an: "Licență, Anul 3", specializare: "Robotică", email: "Licu.Ga.Arina@student.utcluj.ro"},
    {nume: "Timiș", prenume: "Traian-Marius", subtitlu: "Student Reprezentant în BCA", an: "Master, Anul 1", specializare: "Construcții Durabile de Beton", email: "Timis.Al.Traian@student.utcluj.ro"},
    {nume: "Mitocaru", prenume: "Silviu-Gabriel", an: "Anul 4", specializare: "Arhitectură", email: "Mitocaru.Mi.Silviu@student.utcluj.ro"},
    {nume: "Bălănescu", prenume: "Rareș", an: "Licență, Anul 4", specializare: "Calculatoare și Tehnologia Informației", email: "Balanescu.Co.Rares@student.utcluj.ro"},
    {nume: "Coș", prenume: "Tudor", an: "Licență, Anul 3", specializare: "Automatică și Informatică Aplicată (engleză)", email: "Cos.ad.tudor@student.utcluj.ro"},
    {nume: "Juravle", prenume: "Monica", an: "Licență, Anul 4", specializare: "Calculatoare și Tehnologia Informației", email: "Juravle.Va.Monica@student.utcluj.ro"},
    {nume: "Moiceanu", prenume: "Elena-Ștefania", an: "Licență, Anul 2", specializare: "Automatică și Informatică Aplicată (engleză)", email: "Moiceanu.Io.Elena@student.utcluj.ro"},
    {nume: "Tudose", prenume: "Rareș", an: "Licență, Anul 4", specializare: "Calculatoare și Tehnologia Informației", email: "Tudose.Ar.Rares@student.utcluj.ro"},
    {nume: "Abiculesei", prenume: "Denis-Andrei", an: "Licență, Anul 3", specializare: "Inginerie și Management în Construcții", email: "Abiculesei.So.Denis@student.utcluj.ro"},
    {nume: "Lenghel", prenume: "Carmen", an: "Licență, Anul 3", specializare: "Măsurători Terestre și Cadastru", email: "Lenghel.Io.Carmen@student.utcluj.ro"},
    {nume: "Ormindean", prenume: "Vlad-Cosmin", an: "Licență, Anul 2", specializare: "Inginerie Civilă", email: "Ormindean.Si.Vlad@student.utcluj.ro"},
    {nume: "Bondrea", prenume: "Lucian-Andrei", an: "Licență, Anul 3", specializare: "Autovehicule Rutiere", email: "Bondrea.Ad.Lucian@student.utcluj.ro"},
    {nume: "Bria", prenume: "Mara-Aiyana", an: "Licență, Anul 2", specializare: "Mecatronică", email: "Bria.Du.Mara@student.utcluj.ro"},
    {nume: "Afanas", prenume: "Neonila", an: "Licență, Anul 2", specializare: "Inginerie Economică Industrială", email: "Afanas.Va.Neonila@student.utcluj.ro"},
    {nume: "Livinschi", prenume: "Cătălina", an: "Licență, Anul 3", specializare: "Robotică", email: "Livinschi.Vi.Ca@student.utcluj.ro"},
    {nume: "Maxim", prenume: "Andrei-Vasile", an: "Licență, Anul 4", specializare: "Tehnologia Construcțiilor de Mașini (engleză)", email: "Maxim.va.andrei@student.utcluj.ro"},
    {nume: "Arimia", prenume: "Andreea-Ștefania", an: "Licență, Anul 3", specializare: "Inginerie Economică în Domeniul Electric, Electronic și Energetic", email: "Arimia.Io.Andreea@student.utcluj.ro"},
    {nume: "Bujdei", prenume: "Robert", an: "Licență, Anul 2", specializare: "Inginerie Electronică, Telecomunicații și Tehnologii Informaționale (engleză)", email: "Bujdei.Gh.Robert@student.utcluj.ro"},
    {nume: "Ciotea", prenume: "Alexandra-Anamaria", an: "Licență, Anul 4", specializare: "Tehnologii și Sisteme de Telecomunicații (engleză)", email: "Ciotea.Ad.Alexandra@student.utcluj.ro"},
    {nume: "Chirilă", prenume: "Iulian", an: "Licență, Anul 3", specializare: "Ingineria sistemelor electroenergetice", email: "Chirila.Ci.Iulian@student.utcluj.ro"},
    {nume: "Spătăcean", prenume: "Lidia-Giorgiana", an: "Master, Anul 2", specializare: "Științe Inginerești Aplicate în medicină", email: "Spatacean.Gh.Lidia@student.utcluj.ro"},
    {nume: "Precub", prenume: "Alexandru-Ioan", an: "Licență, Anul 1", specializare: "Instalații pentru Construcții", email: "Precub.Io.Alexandru@student.utcluj.ro"},
    {nume: "Joia", prenume: "Simona", an: "Licență, Anul 3", specializare: "Ingineria și Protecția Mediului în Industrie", email: "Joia.Da.Simona@student.utcluj.ro"},
    {nume: "Mureșan", prenume: "Ana-Maria", an: "Licență, Anul 3", specializare: "LRE", email: "Muresan.co.maria@student.utcluj.ro"},
    {nume: "Suciu", prenume: "Alexandra", an: "Master, Anul 1", specializare: "Literatură engleză pentru copii și tineret (LECT)", email: "Suciu.Al.Alexandra@student.utcluj.ro"},
    {nume: "Sillai", prenume: "Beatrice", an: "Master, Anul 2", specializare: "Evaluarea impactului și riscului pentru mediu", email: "Sillai.Al.Beatrice@student.utcluj.ro"},
    {nume: "Borbei", prenume: "Alexandra", an: "Licență, Anul 3", specializare: "Informatică Economică", email: "Borbei.al.alexandra@student.utcluj.ro"},
    {nume: "Covaci", prenume: "Sebastian-Gabriel", an: "Master, Anul 1", specializare: "Managementul Proiectelor Europene", email: "Covaci.CS.Sebastian@student.utcluj.ro"}
];

const faculties = {
    arhitectura: {
        id: "arhitectura",
        name: "FACULTATEA DE ARHITECTURĂ ȘI URBANISM",
        shortName: "Facultatea de Arhitectură și Urbanism",
        formular: "https://forms.office.com/e/VtU8exV6G7",
        members: [
            {nume: "Couți", prenume: "Paul", subtitlu: "Student Reprezentant în BCF", an: "Anul 3", specializare: "Arhitectură", email: "Couti.Ma.Paul@student.utcluj.ro"},
            {nume: "Dâscă", prenume: "Sabrina-Ioana", an: "Anul 4", specializare: "Arhitectură", email: "Dasca.Pe.Sabrina@student.utcluj.ro"},
            {nume: "Rusu", prenume: "George", an: "Anul 2", specializare: "Arhitectură", email: "rusu.da.george@student.utcluj.ro"},
        ]
    },
    automatica: {
        id: "automatica",
        name: "FACULTATEA DE AUTOMATICĂ ȘI CALCULATOARE",
        shortName: "Facultatea de Automatică și Calculatoare",
        formular: "https://forms.office.com/e/H6w8AmvjXC",
        members: [
            {nume: "Tudose", prenume: "Rareș", subtitlu: "Student Reprezentant în BCF", an: "Licență, Anul 4", specializare: "Calculatoare și Tehnologia Informației", email: "Tudose.Ar.Rares@student.utcluj.ro"},
            {nume: "Bălănescu", prenume: "Rareș", an: "Licență, Anul 4", specializare: "Calculatoare și Tehnologia Informației", email: "Balanescu.Co.Rares@student.utcluj.ro"},
            {nume: "Clim", prenume: "Diana", an: "Licență, Anul 3", specializare: "Calculatoare și Tehnologia Informației", email: "Clim.fl.diana@student.utcluj.ro"},
            {nume: "Indreiu", prenume: "Daniela", an: "Licență, Anul 3", specializare: "Automatică și Informatică Aplicată", email: "Indreiu.Da.Daniela@student.utcluj.ro"},
            {nume: "Juravle", prenume: "Monica", an: "Licență, Anul 4", specializare: "Calculatoare și Tehnologia Informației", email: "Juravle.Va.Monica@student.utcluj.ro"},
            {nume: "Moiceanu", prenume: "Elena-Ștefania", an: "Licență, Anul 2", specializare: "Automatică și Informatică Aplicată (engleză)", email: "Moiceanu.Io.Elena@student.utcluj.ro"},
            {nume: "Murariu", prenume: "Georgiana", an: "Licență, Anul 3", specializare: "Calculatoare și Tehnologia Informației (engleză)", email: "Murariu.Io.Georgiana@student.utcluj.ro"},
            {nume: "Pavel", prenume: "Luca-Georgian", an: "Licență, Anul 3", specializare: "Calculatoare și Tehnologia Informației (engleză)", email: "Pavel.ma.luca@student.utcluj.ro"},
            {nume: "Santeiu", prenume: "Anda-Ștefana", an: "Licență, Anul 2", specializare: "Automatică și Informatică Aplicată", email: "Santeiu.Ca.Anda@student.utcluj.ro"},
            {nume: "Șișeștean", prenume: "Andrei", an: "Licență, Anul 2", specializare: "Automatică și Informatică Aplicată", email: "Sisestean.Pe.Andrei@student.utcluj.ro"},
        ]
    },
    autovehicule: {
        id: "autovehicule",
        name: "FACULTATEA DE AUTOVEHICULE RUTIERE, MECATRONICĂ ȘI MECANICĂ",
        shortName: "Facultatea de Autovehicule Rutiere, Mecatronică și Mecanică",
        formular: "https://forms.office.com/e/7g9iEWqQs8",
        members: [
            {nume: "Bria", prenume: "Mara-Aiyana", subtitlu: "Student Reprezentant în BCF", an: "Licență, Anul 2", specializare: "Mecatronică", email: "Bria.Du.Mara@student.utcluj.ro"},
            {nume: "Bondrea", prenume: "Lucian-Andrei", an: "Licență, Anul 3", specializare: "Autovehicule Rutiere", email: "Bondrea.Ad.Lucian@student.utcluj.ro"},
            {nume: "Buzgariu", prenume: "Ioana Niculina", an: "Licență, Anul 2", specializare: "Mecatronică", email: "Buzgariu.Ni.Ioana@student.utcluj.ro"},
            {nume: "Crăcăoanu", prenume: "Klaudia Maria", an: "Licență, Anul 2", specializare: "Ingineria Autovehiculelor", email: "Cracaoanu.co.klaudia@student.utcluj.ro"},
            {nume: "Haitonic", prenume: "Dacian-Alexandru", an: "Licență, Anul 1", specializare: "Ingineria Transporturilor și a Traficului", email: "Haitonic.Al.Dacian@student.utcluj.ro"},
            {nume: "Iaută", prenume: "Claudiu-Marian", an: "Licență, Anul 2", specializare: "Mecanică Fină și Nanotehnologii", email: "Iauta.Ma.Claudiu@student.utcluj.ro"},
            {nume: "Veres", prenume: "Georgian-Ionuț", an: "Licență, Anul 2", specializare: "Autovehicule Rutiere", email: "Veres.Ra.Georgian@student.utcluj.ro"},
        ]
    },
    constructii: {
        id: "constructii",
        name: "FACULTATEA DE CONSTRUCȚII",
        shortName: "Facultatea de Construcții",
        formular: "https://forms.office.com/e/HEHTu96iqF",
        members: [
            {nume: "Ormindean", prenume: "Vlad", subtitlu: "Student Reprezentant în BCF", an: "Licență, Anul 2", specializare: "Inginerie Civilă", email: "Ormindean.Si.Vlad@student.utcluj.ro"},
            {nume: "Timiș", prenume: "Traian-Marius", subtitlu: "Student Reprezentant în BCA", an: "Master, Anul 1", specializare: "Construcții Durabile de Beton", email: "Timis.Al.Traian@student.utcluj.ro"},
            {nume: "Abiculesei", prenume: "Denis-Andrei", an: "Licență, Anul 3", specializare: "Inginerie și Management în Construcții", email: "Abiculesei.So.Denis@student.utcluj.ro"},
            {nume: "Chira", prenume: "Daria-Larisa", an: "Licență, Anul 2", specializare: "Inginerie Civilă", email: "Chira.Da.Daria@student.utcluj.ro"},
            {nume: "Lenghel", prenume: "Carmen-Anamaria", an: "Licență, Anul 3", specializare: "Măsurători Terestre și Cadastru", email: "Lenghel.Io.Carmen@student.utcluj.ro"},
            {nume: "Marcu", prenume: "Petra-Denisa", an: "Licență, Anul 4", specializare: "Construcții Civile, Industriale și Agricole (engleză)", email: "Marcu.Pe.Petra@student.utcluj.ro"},
            {nume: "Stan", prenume: "Giulia", an: "Licență, Anul 2", specializare: "Inginerie Civilă", email: "Stan.Pe.Giulia@student.utcluj.ro"},
            {nume: "Stoian-Pop", prenume: "Alexia-Ioana", an: "Licență, Anul 2", specializare: "Inginerie Civilă", email: "Stoian.Gh.Alexia@student.utcluj.ro"},
            {nume: "Zinici", prenume: "Diana", an: "Licență, Anul 2", specializare: "Inginerie Civilă", email: "Zinici.Du.Diana@student.utcluj.ro"},
        ]
    },
    electronica: {
        id: "electronica",
        name: "FACULTATEA DE ELECTRONICĂ, TELECOMUNICAȚII ȘI TEHNOLOGIA INFORMAȚIEI",
        shortName: "Facultatea de Electronică, Telecomunicații și Tehnologia Informației",
        formular: "https://forms.office.com/e/NncEm0N2hz",
        members: [
            {nume: "Arimia", prenume: "Andreea-Ștefania", subtitlu: "Student Reprezentant în BCF", an: "Licență, Anul 3", specializare: "Inginerie Economică în Domeniul Electric, Electronic și Energetic", email: "Arimia.Io.Andreea@student.utcluj.ro"},
            {nume: "Bujdei", prenume: "Robert", an: "Licență, Anul 2", specializare: "Inginerie Electronică, Telecomunicații și Tehnologii Informaționale (engleză)", email: "Bujdei.gh.robert@student.utcluj.ro"},
            {nume: "Drule", prenume: "Daniela-Ileana", an: "Licență, Anul 4", specializare: "Electronică Aplicată", email: "Drule.vi.daniela@student.utcluj.ro"},
            {nume: "Irimiciuc", prenume: "Cosmin", an: "Licență, Anul 2", specializare: "Inginerie Electronică, Telecomunicații și Tehnologii Informaționale (engleză)", email: "Irimiciuc.gh.cosmin@student.utcluj.ro"},
            {nume: "Pop", prenume: "Lorena Maria", an: "Licență, Anul 2", specializare: "Inginerie Electronică, Telecomunicații și Tehnologii Informaționale", email: "Pop.io.lorena@student.utcluj.ro"},
            {nume: "Signori", prenume: "Gianmario", an: "Licență, Anul 3", specializare: "Tehnologii și Sisteme de Telecomunicații", email: "Signori.gi.gianmario@student.utcluj.ro"},
            {nume: "Tivadar", prenume: "Dragoș-Filip", an: "Licență, Anul 2", specializare: "Inginerie Electronică, Telecomunicații și Tehnologii Informaționale (engleză)", email: "Tivadar.Io.Dragos@student.utcluj.ro"},
        ]
    },
    materiale: {
        id: "materiale",
        name: "FACULTATEA DE INGINERIA MATERIALELOR ȘI A MEDIULUI",
        shortName: "Facultatea de Ingineria Materialelor și a Mediului",
        formular: "https://forms.office.com/e/TNYzuE4s5x",
        members: [
            {nume: "Joia", prenume: "Simona", subtitlu: "Student Reprezentant în BCF", an: "Licență, Anul 3", specializare: "Ingineria și Protecția Mediului în Industrie", email: "Joia.da.simona@student.utcluj.ro"},
            {nume: "Goman", prenume: "Denis Gabriel", an: "Licență, Anul 2", specializare: "Ingineria Materialelor", email: "Goman.pa.denis@student.utcluj.ro"},
            {nume: "Oltean", prenume: "Ariana", an: "Licență, Anul 1", specializare: "Ingineria și Protecția Mediului în Industrie", email: "Oltean.em.ariana@student.utcluj.ro"},
            {nume: "Pop", prenume: "Radu-Florin", an: "Licență, Anul 2", specializare: "Ingineria Procesării Materialelor", email: "Pop.io.rf@student.utcluj.ro"},
        ]
    },
    instalatii: {
        id: "instalatii",
        name: "FACULTATEA DE INGINERIE A INSTALAȚIILOR",
        shortName: "Facultatea de Inginerie a Instalațiilor",
        formular: "https://forms.office.com/e/XztntFqBZP",
        members: [
            {nume: "Precub", prenume: "Alexandru-Ioan", subtitlu: "Student Reprezentant în BCF", an: "Licență, Anul 1", specializare: "Instalații pentru Construcții", email: "Precub.Io.Alexandru@student.utcluj.ro"},
            {nume: "Costea", prenume: "Alina Paula Denisa", an: "Licență, Anul 4", specializare: "Instalații pentru Construcții", email: "Costea.St.Alina@student.utcluj.ro"},
            {nume: "Nașca", prenume: "Tudor", an: "Master, Anul 1", specializare: "Ingineria Instalațiilor", email: "Nasca.Gh.Tudor@student.utcluj.ro"},
        ]
    },
    electrica: {
        id: "electrica",
        name: "FACULTATEA DE INGINERIE ELECTRICĂ",
        shortName: "Facultatea de Inginerie Electrică",
        formular: "https://forms.office.com/e/rRN1y2dkFy",
        members: [
            {nume: "Spătăcean", prenume: "Lidia-Giorgiana", subtitlu: "Student Reprezentant în BCF", an: "Master, Anul 2", specializare: "Științe Inginerești Aplicate în medicină", email: "Spatacean.Gh.Lidia@student.utcluj.ro"},
            {nume: "Chirilă", prenume: "Iulian", an: "Licență, Anul 3", specializare: "Ingineria sistemelor electroenergetice", email: "Chirila.ci.iulian@student.utcluj.ro"},
            {nume: "Constandache", prenume: "Ionela", an: "Licență, Anul 2", specializare: "Inginerie Economică în domeniul Electric, Electronic și Energetic", email: "Constandache.il.io@student.utcluj.ro"},
            {nume: "Drăguș", prenume: "Ioan-Darius", an: "Licență, Anul 2", specializare: "Inginerie Electrică", email: "Dragus.Ma.Ioan@student.utcluj.ro"},
            {nume: "Dumitrean", prenume: "Denis", an: "Licență, Anul 3", specializare: "Electromecanică", email: "Dumitrean.Se.Denis@student.utcluj.ro"},
            {nume: "Moldovan", prenume: "Ana-Maria", an: "Licență, Anul 4", specializare: "Electronică de Putere și Acționări Electrice", email: "Moldovan.ma.ana@student.utcluj.ro"},
        ]
    },
    industriala: {
        id: "industriala",
        name: "FACULTATEA DE INGINERIE INDUSTRIALĂ, ROBOTICĂ ȘI MANAGEMENTUL PRODUCȚIEI",
        shortName: "Facultatea de Inginerie Industrială, Robotică și Managementul Producției",
        formular: "https://forms.office.com/e/AEFgFG7nTZ",
        members: [
            {nume: "Afanas", prenume: "Neonila", an: "Licență, Anul 2", specializare: "Inginerie Economică Industrială", email: "Afanas.Va.Neonila@student.utcluj.ro"},
            {nume: "Dan", prenume: "Andrada Nicola", an: "Licență, Anul 3", specializare: "Robotică", email: "Dan.Ni.Andrada@student.utcluj.ro"},
            {nume: "Licu", prenume: "Arina-Andreea", subtitlu: "Student Reprezentant în BCF", an: "Licență, Anul 3", specializare: "Robotică", email: "Licu.Ga.Arina@student.utcluj.ro"},
            {nume: "Livinschi", prenume: "Cătălina", an: "Licență, Anul 3", specializare: "Robotică", email: "Livinschi.Vi.Ca@student.utcluj.ro"},
            {nume: "Maxim", prenume: "Andrei", an: "Licență, Anul 4", specializare: "Tehnologia Construcțiilor de Mașini (engleză)", email: "Maxim.va.andrei@student.utcluj.ro"},
            {nume: "Mititean", prenume: "Florina", an: "Licență, Anul 2", specializare: "Inginerie Industrială", email: "Mititean.vi.florina@student.utcluj.ro"},
            {nume: "Negură", prenume: "Daria Ana-Maria", an: "Licență, Anul 2", specializare: "Inginerie Economică Industrială", email: "Negura.Lu.Daria@student.utcluj.ro"},
            {nume: "Streza", prenume: "Bogdan", an: "Licență, Anul 3", specializare: "Robotică", email: "Streza.co.cornel@student.utcluj.ro"},
            {nume: "Suciu", prenume: "Bianca", an: "Licență, Anul 2", specializare: "Tehnologia Construcțiilor de Mașini", email: "Suciu.Ni.Bianca@student.utcluj.ro"},
        ]
    },
    "inginerie-bm": {
        id: "inginerie-bm",
        name: "FACULTATEA DE INGINERIE (CUNBM)",
        shortName: "Facultatea de Inginerie (CUNBM)",
        formular: "https://forms.office.com/e/FU9BzW2wES",
        members: [
            {nume: "Gyorgy", prenume: "Melissza Szemida", an: "Licență, Anul 4", specializare: "Ingineria sistemelor electroenergetice", email: "Gyorgy.sa.melissza@student.utcluj.ro"},
            {nume: "Koloszvary", prenume: "Alexandru Andrei", an: "Licență, Anul 1", specializare: "ISFF", email: "Koloszvary.Al.Al@student.utcluj.ro"},
            {nume: "Sillai", prenume: "Beatrice", an: "Master, Anul 2", specializare: "Evaluarea impactului și riscului pentru mediu", email: "Sillai.Al.Beatrice@student.utcluj.ro"},
            {nume: "Țînțaș", prenume: "Gheorghe-Mihăiță", an: "Licență, Anul 1", specializare: "Sisteme inteligente în internetul lucrărilor", email: "Tintas.Gh.Gheorghe@student.utcluj.ro"},
        ]
    },
    "litere-bm": {
        id: "litere-bm",
        name: "FACULTATEA DE LITERE (CUNBM)",
        shortName: "Facultatea de Litere (CUNBM)",
        formular: "https://forms.office.com/e/vaAxF6YSAa",
        members: [
            {nume: "Gaier", prenume: "Andreea-Cristina", an: "Master, Anul 1", specializare: "Limba franceză în traduceri specializate", email: "Gaier.Ad.Andreea@student.utcluj.ro"},
            {nume: "Mureșan", prenume: "Ana-Maria", an: "Licență, Anul 3", specializare: "LRE", email: "Muresan.co.maria@student.utcluj.ro"},
            {nume: "Popdan", prenume: "Nicoleta-Andreea", an: "Licență, Anul 1 și Anul 3", specializare: "Pedagogia Învățământului Primar și Preșcolar, Asistență Socială", email: "Popdan.gh.nicoleta@student.utcluj.ro"},
            {nume: "Suciu", prenume: "Alexandra", an: "Master, Anul 1", specializare: "Literatură engleză pentru copii și tineret (LECT)", email: "Suciu.Al.Alexandra@student.utcluj.ro"},
        ]
    },
    "stiinte-bm": {
        id: "stiinte-bm",
        name: "FACULTATEA DE ȘTIINȚE (CUNBM)",
        shortName: "Facultatea de Științe (CUNBM)",
        formular: "https://forms.office.com/e/TQNXuPDVgU",
        members: [
            {nume: "Borbei", prenume: "Alexandra", an: "Licență, Anul 3", specializare: "Informatică Economică", email: "Borbei.al.alexandra@student.utcluj.ro"},
            {nume: "Borșa", prenume: "Cătălin", an: "Licență, Anul 1", specializare: "IEC", email: "Borsa.Fe.Catalin@student.utcluj.ro"},
            {nume: "Leonte", prenume: "Cosmin", an: "Licență, Anul 3", specializare: "Informatică", email: "Leonte.ma.cosmin@student.utcluj.ro"},
            {nume: "Covaci", prenume: "Sebastian-Gabriel", an: "Master, Anul 1", specializare: "Managementul Proiectelor Europene", email: "Covaci.CS.Sebastian@student.utcluj.ro"},
            {nume: "Rus", prenume: "Gabriela Maria", an: "Licență, Anul 3", specializare: "Biologie", email: "Rus.Ro.Gabriela@student.utcluj.ro"},
        ]
    },
};

type Representative = {
    nume: string;
    prenume: string;
    subtitlu?: string;
    an?: string;
    specializare?: string;
    email?: string;
};

const ReprezCard = ({ member }: { member: Representative }) => {
    const raportLink = member.email ? ACTIVITY_REPORTS[member.email.toLowerCase()] : undefined;

    return (
        <div className="sr-reprez">
            <h1>{member.nume}</h1>
            <h2>{member.prenume}</h2>
            {member.specializare && (
                <p className="sr-specializare" style={{ color: '#aaaaaa', fontSize: '14px', marginTop: '6px', lineHeight: '1.2' }}>
                    {member.specializare}
                </p>
            )}
            {member.an && (
                <p className="sr-an" style={{ color: '#888888', fontSize: '13px', marginTop: '4px' }}>
                    {member.an}
                </p>
            )}
            {member.email && (
                <a href={`mailto:${member.email}`} className="sr-email" style={{ color: '#cc0000', fontSize: '15px', marginTop: '8px', display: 'inline-block', textDecoration: 'none', transition: 'color 0.2s ease-in-out' }} onMouseOver={(e) => (e.currentTarget.style.color = '#ff3333')} onMouseOut={(e) => (e.currentTarget.style.color = '#cc0000')}>
                    {member.email}
                </a>
            )}
            {raportLink && (
                <a href={raportLink} target="_blank" rel="noopener noreferrer" className="sr-activity-report">
                    Raport de Activitate
                </a>
            )}
            {member.subtitlu && (
                <p className="sr-subtitle" style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginTop: '10px', textTransform: 'uppercase' }}>
                    {member.subtitlu}
                </p>
            )}
        </div>
    );
};

export default function EducationalContent({ initialPosts }: { initialPosts?: Post[] } = {}) {
    const [activeTab, setActiveTab] = useState<"senat" | "consiliu" | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedFaculty = selectedFacultyId ? faculties[selectedFacultyId as keyof typeof faculties] : null;

    return (
        <main className="font-sans pb-16 min-h-screen pt-40 text-zinc-900 dark:text-white flex flex-col items-center">
            
            <div className="w-full flex flex-col items-center mb-24 px-6 lg:px-20" id="osut-te-informeaza">
                <div className="w-full max-w-5xl flex justify-center items-center mb-10 gap-4 md:gap-8">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-600 opacity-100"></div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-zinc-900 dark:text-white text-center uppercase shrink-0">
OSUT te informează          </h1>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-600 opacity-100"></div>
        </div>
                
                <div className="w-full max-w-7xl">
                    <BlogSection initialPosts={initialPosts} />
                </div>
            </div>

            <div className="w-full flex flex-col items-center mb-24 px-6 lg:px-20" id="resurse">
                <div className="w-full max-w-5xl flex justify-center items-center mb-10 gap-4 md:gap-8">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-600 opacity-100"></div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-zinc-900 dark:text-white text-center uppercase shrink-0">
Resurse          </h1>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-600 opacity-100"></div>
        </div>

                <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {DOCUMENTS.map((doc, i) => (
                        <a 
                            key={i} 
                            href={doc.downloadLink} 
                            download
                            className="flex flex-row items-center justify-center gap-3 bg-[#b51c1c] hover:bg-[#8f1515] text-white px-6 py-5 rounded-xl font-bold text-sm transition-all duration-300 shadow-xl shadow-black/50 hover:shadow-red-900/50 hover:-translate-y-1 border border-red-900/40 text-center"
                        >
                            <i className={`${doc.icon} text-lg`}></i>
                            <span className="leading-tight">{doc.title}</span>
                        </a>
                    ))}
                </div>
            </div>

            <div className="w-full flex flex-col items-center mb-16 px-6 lg:px-20" id="studenti-reprezentanti">
                <div className="w-full max-w-5xl flex justify-center items-center mb-10 gap-4 md:gap-8">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-red-600 opacity-100"></div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-zinc-900 dark:text-white text-center uppercase shrink-0">
Studenți Reprezentanți          </h1>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-red-600 opacity-100"></div>
        </div>

                <div className="w-full max-w-7xl">
                    <div className="sr-menu-selector">
                        <button
                            className={`sr-menu-btn ${activeTab === "senat" ? "active" : ""}`}
                            onClick={() => setActiveTab("senat")}
                        >
                            Senatul Universității
                        </button>
                        <button
                            className={`sr-menu-btn ${activeTab === "consiliu" ? "active" : ""}`}
                            onClick={() => setActiveTab("consiliu")}
                        >
                            Consiliul Facultății
                        </button>
                    </div>

                    {activeTab === "consiliu" && (
                        <div className="sr-faculty-selector">
                            <div className="sr-custom-dropdown" ref={dropdownRef}>
                                <button
                                    className={`sr-dropdown-trigger outline-none ring-0 ${isDropdownOpen ? "open" : ""}`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <span>{selectedFaculty ? selectedFaculty.shortName : "Alege Facultatea"}</span>
                                    <span className="chevron">▼</span>
                                </button>
                                <div className={`sr-dropdown-options ${isDropdownOpen ? "open" : ""}`}>
                                    {Object.values(faculties).map((fac) => (
                                        <button
                                            key={fac.id}
                                            className={`sr-dropdown-option ${selectedFacultyId === fac.id ? "selected" : ""}`}
                                            onClick={() => {
                                                setSelectedFacultyId(fac.id);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {fac.shortName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "senat" && (
                        <div className="sr-section-content mt-10">
                            <div className="sr-form-actions">
                                <a href={SENAT_EVALUATION_FORM} target="_blank" rel="noopener noreferrer" className="sr-evaluation-form">
                                    Formular de evaluare
                                </a>
                            </div>
                            <div className="sr-scroll-container">
                                {senatMembers.map((member, idx) => (
                                    <ReprezCard key={idx} member={member} />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "consiliu" && selectedFaculty && (
                        <div className="sr-section-content mt-10">
                            <div className="sr-form-actions">
                                <a href={selectedFaculty.formular} target="_blank" rel="noopener noreferrer" className="sr-evaluation-form">
                                    Formular de evaluare
                                </a>
                            </div>
                            <div className="sr-scroll-container">
                                {selectedFaculty.members.map((member, idx) => (
                                    <ReprezCard key={idx} member={member} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
        </main>
    );
}
