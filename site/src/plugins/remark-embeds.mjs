import { visit } from 'unist-util-visit';

const embedHandlers = {
  youtube: (attrs) => {
    const id = attrs.id || '';
    return `<div class="embed-responsive my-6"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full aspect-video rounded-lg"></iframe></div>`;
  },
  bilibili: (attrs) => {
    const bv = attrs.bv || '';
    return `<div class="embed-responsive my-6"><iframe src="https://player.bilibili.com/player.html?bvid=${bv}&high_quality=1" title="Bilibili" frameborder="0" allowfullscreen class="w-full aspect-video rounded-lg"></iframe></div>`;
  },
  tweet: (attrs) => {
    const id = attrs.id || '';
    return `<div class="my-6"><blockquote class="twitter-tweet"><a href="https://twitter.com/x/status/${id}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js"></script></div>`;
  },
  vimeo: (attrs) => {
    const id = attrs.id || '';
    return `<div class="embed-responsive my-6"><iframe src="https://player.vimeo.com/video/${id}" title="Vimeo" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="w-full aspect-video rounded-lg"></iframe></div>`;
  },
  gist: (attrs) => {
    const id = attrs.id || '';
    return `<div class="my-6"><script src="https://gist.github.com/${id}.js"></script></div>`;
  },
  codepen: (attrs) => {
    const id = attrs.id || '';
    const user = attrs.user || '';
    return `<div class="my-6"><iframe height="400" class="w-full rounded-lg" scrolling="no" src="https://codepen.io/${user}/embed/${id}?default-tab=result" frameborder="0" allowfullscreen></iframe></div>`;
  },
};

export function remarkEmbeds() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === 'leafDirective' || node.type === 'containerDirective') {
        const handler = embedHandlers[node.name];
        if (handler) {
          const attrs = node.attributes || {};
          node.type = 'html';
          node.value = handler(attrs);
          node.children = undefined;
        }
      }
    });
  };
}
