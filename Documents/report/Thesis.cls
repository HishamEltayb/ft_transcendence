%%
%% This is file Thesis.cls', based on 'ECSthesis.cls', by Steve R. Gunn
%% generated with the docstrip utility.
%%
%% Created by Steve R. Gunn, modified by Sunil Patel: www.sunilpatel.co.uk

% ==============================
% Thesis.cls - CLASS SETTINGS
% ==============================
% Require LaTeX2e, dated Dec 1996 or later
\NeedsTeXFormat{LaTeX2e}[1996/12/01]
% Declare this as the Thesis class
\ProvidesClass{Thesis}
              [2007/22/02 v1.0
   LaTeX document class]
% Base this class on the standard 'book' class
\def\baseclass{book}
% Pass all options to 'book'
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{\baseclass}}
\def\@checkoptions#1#2{
  \edef\@curroptions{\@ptionlist{\@currname.\@currext}}
  \@tempswafalse
  \@tfor\@this:=#2\do{
    \@expandtwoargs\in@{,\@this,}{,\@curroptions,}
    \ifin@ \@tempswatrue \@break@tfor \fi}
  \let\@this\@empty
  \if@tempswa \else \PassOptionsToClass{#1}{\baseclass}\fi
}
% The next lines ensure that only one of 10pt, 11pt, or 12pt is set, defaulting to 11pt if not specified
\@checkoptions{11pt}{{10pt}{11pt}{12pt}}
% Set default paper size to A4
\PassOptionsToClass{a4paper}{\baseclass}
\ProcessOptions\relax
% Load the base class
\LoadClass{\baseclass}
\newcommand\bhrule{\typeout{------------------------------------------------------------------------------}}

\newcommand\Declaration[1]{
\btypeout{Declaration of Authorship}
\addtotoc{Declaration of Authorship}
\thispagestyle{plain}
\null\vfil
%\vskip 60\p@
\begin{center}{\huge\bf Declaration of Authorship\par}\end{center}
%\vskip 60\p@
{\normalsize #1}
\vfil\vfil\null
%\cleardoublepage
}

\newcommand\btypeout[1]{\bhrule\typeout{\space #1}\bhrule}
% Redefine \today to print "Month Year"
\def\today{\ifcase\month\or
  January\or February\or March\or April\or May\or June\or
  July\or August\or September\or October\or November\or December\fi
  \space \number\year}
% Spacing and paragraph formatting
\usepackage{setspace}
\onehalfspacing                         % 1.5 line spacing
\setlength{\parindent}{0pt}             % No paragraph indentation
\setlength{\parskip}{2.0ex plus0.5ex minus0.2ex} % Paragraph spacing
% Page margin settings
\usepackage{vmargin}
\setmarginsrb           { .7in}  % left margin
                        { 0.6in}  % top margin
                        { 1.0in}  % right margin
                        { 0.8in}  % bottom margin
                        {  20pt}  % head height
                        {0.25in}  % head sep
                        {   9pt}  % foot height
                        { 0.3in}  % foot sep
% Penalties for line breaking, widows/orphans, etc.
\raggedbottom                           % Don't stretch vertical spacing to fill page
\setlength{\topskip}{1\topskip \@plus 5\p@}
\doublehyphendemerits=10000             % No consecutive hyphens
\brokenpenalty=10000                    % No broken words across columns/pages
\widowpenalty=9999                      % Almost no widows at bottom of page
\clubpenalty=9999                       % Almost no orphans at top of page
\interfootnotelinepenalty=9999          % Avoid breaking footnotes over pages
\usepackage{fancyhdr}
\lhead[\rm\thepage]{\fancyplain{}{\sl{\rightmark}}}
% \rhead[\fancyplain{}{\sl{\leftmark}}]{\rm\thepage}
\chead{}\lfoot{}\rfoot{}\cfoot{}
\pagestyle{fancy}
\renewcommand{\chaptermark}[1]{\btypeout{\thechapter\space #1}\markboth{\@chapapp\ \thechapter\ #1}{\@chapapp\ \thechapter\ #1}}
\renewcommand{\sectionmark}[1]{}
\renewcommand{\subsectionmark}[1]{}
\def\cleardoublepage{\clearpage\if@twoside \ifodd\c@page\else
\hbox{}
\thispagestyle{empty}
\newpage
\if@twocolumn\hbox{}\newpage\fi\fi\fi}
% ==============================
% Theorem and Caption Styles
% ==============================
\usepackage{amsmath,amsfonts,amssymb,amscd,amsthm,xspace}
% Define theorem, corollary, lemma, proposition, axiom, definition, remark environments
\theoremstyle{plain}
\newtheorem{example}{Example}[chapter]
\newtheorem{theorem}{Theorem}[chapter]
\newtheorem{corollary}[theorem]{Corollary}
\newtheorem{lemma}[theorem]{Lemma}
\newtheorem{proposition}[theorem]{Proposition}
\newtheorem{axiom}[theorem]{Axiom}
\theoremstyle{definition}
\newtheorem{definition}[theorem]{Definition}
\theoremstyle{remark}
\newtheorem{remark}[theorem]{Remark}
% Caption formatting for figures and tables
\usepackage[centerlast,small,sc]{caption}
\setlength{\captionmargin}{20pt}
% ==============================
% Reference Shortcuts
% ==============================
\newcommand{\fref}[1]{Figure~\ref{#1}}    % Shortcut for Figure references
\newcommand{\tref}[1]{Table~\ref{#1}}     % Table reference
\newcommand{\eref}[1]{Equation~\ref{#1}}  % Equation reference
\newcommand{\cref}[1]{Chapter~\ref{#1}}   % Chapter reference
\newcommand{\sref}[1]{Section~\ref{#1}}   % Section reference
\newcommand{\aref}[1]{Appendix~\ref{#1}}  % Appendix reference
% ==============================
% Float and Figure Settings
% ==============================
\renewcommand{\topfraction}{0.85}         % Allow up to 85% of page for floats at top
\renewcommand{\bottomfraction}{.85}       % ... at bottom
\renewcommand{\textfraction}{0.1}         % At least 10% of page for text
\renewcommand{\dbltopfraction}{.85}       % For double-column floats
\renewcommand{\floatpagefraction}{0.75}   % At least 75% of float page must be floats
\renewcommand{\dblfloatpagefraction}{.75}
\setcounter{topnumber}{9}                 % Max floats at top
\setcounter{bottomnumber}{9}              % Max at bottom
\setcounter{totalnumber}{20}              % Max total floats
\setcounter{dbltopnumber}{9}              % Max double-column floats
% ==============================
% Graphics and Listings
% ==============================
\usepackage{graphicx}                     % For including graphics
\usepackage{epstopdf}                     % For EPS to PDF conversion
\usepackage[scriptsize]{subfigure}        % For subfigures
\usepackage{booktabs}                     % For better tables
\usepackage{rotating}                     % For rotated tables/figures
\usepackage{listings}                     % For code listings
\usepackage{lstpatch}
\lstset{captionpos=b,
        frame=tb,
        basicstyle=\scriptsize\ttfamily,
        showstringspaces=false,
        keepspaces=true}                   % Set up code listing style
\lstdefinestyle{matlab} {
        language=Matlab,
        keywordstyle=\color{blue},
        commentstyle=\color[rgb]{0.13,0.55,0.13}\em,
        stringstyle=\color[rgb]{0.7,0,0} } % MATLAB code style
% ==============================
% Hyperlinks and PDF Metadata
% ==============================
\usepackage[pdfpagemode={UseOutlines},bookmarks=true,bookmarksopen=true,
   bookmarksopenlevel=0,bookmarksnumbered=true,hypertexnames=false,
   colorlinks,linkcolor={blue},citecolor={blue},urlcolor={red},
   pdfstartview={FitV},unicode,breaklinks=true]{hyperref}
\pdfstringdefDisableCommands{
   \let\\\space
}
% ==============================
% Title Page and Abstract
% ==============================
% Custom commands for supervisor, examiner, degree, authors, etc.
\newcommand*{\supervisor}[1]{\def\supname{#1}}
\newcommand*{\examiner}[1]{\def\examname{#1}}
\newcommand*{\degree}[1]{\def\degreename{#1}}
\newcommand*{\authors}[1]{\def\authornames{#1}}
\newcommand*{\addresses}[1]{\def\addressnames{#1}}
\newcommand*{\university}[1]{\def\univname{#1}}
\newcommand*{\UNIVERSITY}[1]{\def\UNIVNAME{#1}}
\newcommand*{\department}[1]{\def\deptname{#1}}
\newcommand*{\DEPARTMENT}[1]{\def\DEPTNAME{#1}}
\newcommand*{\group}[1]{\def\groupname{#1}}
\newcommand*{\GROUP}[1]{\def\GROUPNAME{#1}}
\newcommand*{\faculty}[1]{\def\facname{#1}}
\newcommand*{\FACULTY}[1]{\def\FACNAME{#1}}
\newcommand*{\subject}[1]{\def\subjectname{#1}}
\newcommand*{\keywords}[1]{\def\keywordnames{#1}}
\supervisor  {}
\examiner    {}
\degree      {}
\authors     {}

\UNIVERSITY
                {}
            
\addresses   {}
\subject     {}
\keywords    {}
% Custom title page formatting
\renewcommand\maketitle{
  \btypeout{Title Page}
  \hypersetup{pdftitle={\@title}}
  \hypersetup{pdfsubject=\subjectname}
  \hypersetup{pdfauthor=\authornames}
  \hypersetup{pdfkeywords=\keywordnames}
  \thispagestyle{empty}
  \begin{titlepage}
    \let\footnotesize\small
    \let\footnoterule\relax
    \let \footnote \thanks
    \setcounter{footnote}{0}
    \null\vfil
    \vskip 60\p@
    \begin{center}
      \setlength{\parskip}{0pt}
      {\large\textbf{\UNIVNAME}\par}
      \vspace*{20pt}
        \includegraphics[width = 4 in, height =1.5 in]{./Figures/42AD}
      
      \vfill
      {\huge \bf \@title \par}
      \vfill
      \textit{ Team Members:}\par
      \smallskip
      {\Large
      \begin{tabular}{rl@{\hspace{2em}}c@{\hspace{1em}}l}
         1. & Deiaaeldin Hamad & - & \texttt{dehamad} \\
         2. & Mohammed Mohammed & - & \texttt{mohammoh} \\
         3. & Mohamed Nour & - & \texttt{mohamoha} \\
         4. & Ahmed Ibrahim & - & \texttt{ahibrahi} \\
         5. & Hisham Eltayb & - & \texttt{heltayb}
      \end{tabular}
      \par}
      \bigskip
      \smallskip
      \smallskip
      \textit{ Submission Date:}
      {
      May. 1st 2025
      }
    
      
    \end{center}
  \end{titlepage}
  \setcounter{footnote}{0}%
  \global\let\thanks\relax
  \global\let\maketitle\relax
  \global\let\@thanks\@empty
  \global\let\@author\@empty
  \global\let\@date\@empty
  \global\let\@title\@empty
  \global\let\title\relax
  \global\let\author\relax
  \global\let\date\relax
  \global\let\and\relax
  \cleardoublepage
}
% Abstract environment
\newenvironment{abstract}
{
  \btypeout{Abstract Page}
  \thispagestyle{empty}
  \null\vfil
  \begin{center}
    \setlength{\parskip}{0pt}
    {\normalsize \UNIVNAME \par}
    \bigskip
    {\huge{\textit{Abstract}} \par}
    \bigskip
    {\normalsize   \par}
    \bigskip
    \bigskip
    {\normalsize\bf \@title \par}
    \medskip
{\normalsize    
            
           \texttt{ } \\
           \texttt{ } \\
           \texttt{ } \par}

    \bigskip
  \end{center}
}
{
  \vfil\vfil\vfil\null
  \cleardoublepage
}
% ==============================
% Table of Contents and Lists
% ==============================
\addtocounter{secnumdepth}{1}
\setcounter{tocdepth}{6}
\newcounter{dummy}
\newcommand\addtotoc[1]{...}
\renewcommand\tableofcontents{...}
\renewcommand\listoffigures{...}
\renewcommand\listoftables{...}
\newcommand\listsymbolname{Abbreviations}
\usepackage{longtable}
\usepackage{float}
\newcommand\listofsymbols[2]{...}
\newcommand\listconstants{Physical Constants}
\usepackage{longtable}
\newcommand\listofconstants[2]{...}
\newcommand\listnomenclature{Symbols}
\usepackage{longtable}
\newcommand\listofnomenclature[2]{...}
% ==============================
% Acknowledgements and Dedicatory
% ==============================
\newcommand\acknowledgements[1]{...}
\newcommand\dedicatory[1]{...}
% ==============================
% Backmatter (for bibliography)
% ==============================
\renewcommand\backmatter{...}
\endinput
%%
%% End of file Thesis.cls'.